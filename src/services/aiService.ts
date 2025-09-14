import { AIProvider, FileMetadata, ArchivePlan, FolderPlan } from '@/types/archiver';

export interface AIAnalysisRequest {
  files: FileMetadata[];
  provider: AIProvider;
  existingFolders?: string[];
}

export interface AIAnalysisResponse {
  plan: ArchivePlan;
  confidence: number;
}

class AIService {
  private async makeRequest(provider: AIProvider, messages: any[]): Promise<any> {
    const baseUrl = provider.baseUrl || this.getDefaultBaseUrl(provider.id);
    const endpoint = provider.id === 'ollama' ? '/api/chat' : '/chat/completions';
    
    const body = provider.id === 'ollama' 
      ? {
          model: provider.model || 'llama3.2',
          messages,
          stream: false
        }
      : {
          model: provider.model || this.getDefaultModel(provider.id),
          messages,
          temperature: 0.3,
          max_tokens: 2000
        };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (provider.id !== 'ollama') {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private getDefaultBaseUrl(providerId: string): string {
    switch (providerId) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'openrouter':
        return 'https://openrouter.ai/api/v1';
      case 'ollama':
        return 'http://localhost:11434';
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  }

  private getDefaultModel(providerId: string): string {
    switch (providerId) {
      case 'openai':
        return 'gpt-4o-mini';
      case 'openrouter':
        return 'meta-llama/llama-4-maverick:free';
      case 'ollama':
        return 'llama3.2';
      default:
        return 'gpt-4o-mini';
    }
  }

  async analyzeFiles(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const { files, provider, existingFolders = [] } = request;

    // Create analysis prompt
    const fileDescriptions = files.map(file => ({
      name: file.path,
      type: file.mime,
      size: file.size,
      excerpt: file.excerpt.substring(0, 200),
      content_preview: this.getContentPreview(file)
    }));

    const systemPrompt = `You are an intelligent file organization assistant. Analyze the provided files and create a smart folder structure.

Rules:
1. Create meaningful folder names based on content, not just file types
2. Group similar files together logically
3. Use descriptive but concise folder names
4. Consider date-based organization for documents
5. Reuse existing folders when appropriate: ${existingFolders.join(', ')}
6. Detect sensitive files (passwords, keys, personal data)
7. Provide confidence scores (0.0-1.0) for all decisions

Respond ONLY with valid JSON in this exact format:
{
  "folders": [
    {
      "name": "folder-name",
      "display_name": "Human Readable Name",
      "rationale": "Why these files belong together",
      "confidence": 0.85,
      "files": [
        {
          "path": "file.txt",
          "action": "move",
          "reason": "Content analysis result",
          "confidence": 0.90
        }
      ]
    }
  ],
  "detected_topics": ["Topic1", "Topic2"],
  "sensitive_files": [
    {
      "path": "sensitive.txt",
      "type": "password-file",
      "advice": "Handle with care"
    }
  ]
}`;

    const userPrompt = `Analyze these files and create an intelligent folder structure:

${JSON.stringify(fileDescriptions, null, 2)}

Total files: ${files.length}
Existing folders to consider reusing: ${existingFolders.length > 0 ? existingFolders.join(', ') : 'None'}`;

    try {
      const response = await this.makeRequest(provider, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const content = provider.id === 'ollama' 
        ? response.message?.content 
        : response.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response content from AI provider');
      }

      // Parse AI response
      const aiResult = this.parseAIResponse(content);
      
      // Create full archive plan
      const plan = this.createArchivePlan(files, aiResult, existingFolders);
      
      return {
        plan,
        confidence: plan.metrics.confidence_mean
      };

    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getContentPreview(file: FileMetadata): string {
    if (file.mime.startsWith('text/') || file.mime.includes('json') || file.mime.includes('xml')) {
      return file.excerpt;
    }
    
    if (file.mime.startsWith('image/')) {
      return `Image file: ${file.path}`;
    }
    
    if (file.mime.includes('pdf')) {
      return `PDF document: ${file.path}`;
    }
    
    return `Binary file: ${file.path} (${file.mime})`;
  }

  private parseAIResponse(content: string): any {
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }
  }

  private createArchivePlan(files: FileMetadata[], aiResult: any, existingFolders: string[]): ArchivePlan {
    const folders: FolderPlan[] = aiResult.folders || [];
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    
    // Create operations list
    const operations = [
      ...folders.map(folder => ({
        op: 'create_folder' as const,
        target: folder.name,
        items: [] as string[],
        estimated_effect: { size_change: 0 }
      })),
      ...folders.flatMap(folder => 
        folder.files.map(file => ({
          op: file.action as 'move' | 'copy' | 'link',
          target: folder.name,
          items: [file.path],
          estimated_effect: { 
            size_change: file.action === 'copy' ? files.find(f => f.path === file.path)?.size || 0 : 0 
          }
        }))
      )
    ];

    // Calculate metrics
    const allConfidences = [
      ...folders.map(f => f.confidence),
      ...folders.flatMap(f => f.files.map(file => file.confidence))
    ];
    const confidence_mean = allConfidences.length > 0 
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length 
      : 0;

    return {
      root_path: "/analyzed-files",
      summary: {
        total_files: files.length,
        total_size: totalSize,
        detected_topics: aiResult.detected_topics || [],
        sensitive_count: aiResult.sensitive_files?.length || 0,
        recommended_folders: folders.length
      },
      folders,
      operations,
      dedupe: {
        duplicates: [],
        strategy_used: 'keep-one'
      },
      sensitive: aiResult.sensitive_files || [],
      rollback: {
        instructions: [
          "All operations are logged with timestamps",
          "Use 'Undo Archive' to restore original structure",
          "Backup created before execution"
        ],
        timestamped_log_reference: `archive_${Date.now()}`
      },
      metrics: {
        confidence_mean,
        folders_created: folders.length,
        files_moved: folders.reduce((acc, f) => acc + f.files.length, 0)
      },
      errors: [],
      config_used: {
        auto_confirm: false,
        confidence_threshold: 0.5,
        max_folders: 10,
        allow_transforms: {
          ocr: false,
          transcribe: false
        },
        dedupe_strategy: 'keep-one',
        verbose: true,
        naming_style: 'topic-first',
        max_folder_name_length: 50
      }
    };
  }

  async testConnection(provider: AIProvider): Promise<boolean> {
    try {
      const testMessages = [
        { role: 'user', content: 'Hello, respond with just "OK" to test the connection.' }
      ];

      const response = await this.makeRequest(provider, testMessages);
      
      const content = provider.id === 'ollama' 
        ? response.message?.content 
        : response.choices?.[0]?.message?.content;

      return !!content;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService();