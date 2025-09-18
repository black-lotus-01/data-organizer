import Tesseract from 'tesseract.js';
import { aiService } from './aiService';
import { AIProvider } from '@/types/archiver';

export interface ContentAnalysis {
  fileType: string;
  mimeType: string;
  extractedText: string;
  contentPreview: string;
  metadata: Record<string, any>;
  aiClassification?: AIClassificationResult;
  ocrText?: string;
  confidence: number;
}

export interface AIClassificationResult {
  recommendedCategory: string;
  recommendedFolder: string;
  contentType: string;
  tags: string[];
  confidence: number;
  reasoning: string;
  isSensitive: boolean;
  language?: string;
}

class ContentAnalysisService {
  private static readonly CONTENT_PREVIEW_LENGTH = 1000;
  private static readonly SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  private static readonly SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
  private static readonly TEXT_TYPES = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'text/xml', 'text/csv'];
  private static readonly CODE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];

  async analyzeFile(file: File, aiProvider?: AIProvider): Promise<ContentAnalysis> {
    console.log(`Starting content analysis for: ${file.name}`);
    
    const baseAnalysis: ContentAnalysis = {
      fileType: this.getFileCategory(file),
      mimeType: file.type,
      extractedText: '',
      contentPreview: '',
      metadata: {
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified),
        extension: this.getFileExtension(file.name)
      },
      confidence: 0
    };

    try {
      // Extract content based on file type
      await this.extractContent(file, baseAnalysis);
      
      // Generate content preview
      baseAnalysis.contentPreview = this.generateContentPreview(baseAnalysis.extractedText);
      
      // Get AI classification if provider is available
      if (aiProvider && baseAnalysis.contentPreview) {
        baseAnalysis.aiClassification = await this.getAIClassification(baseAnalysis, aiProvider);
      }
      
      // Calculate overall confidence
      baseAnalysis.confidence = this.calculateConfidence(baseAnalysis);
      
      console.log(`Content analysis completed for: ${file.name}`);
      return baseAnalysis;
      
    } catch (error) {
      console.error(`Error analyzing file ${file.name}:`, error);
      baseAnalysis.confidence = 0.1;
      return baseAnalysis;
    }
  }

  private async extractContent(file: File, analysis: ContentAnalysis): Promise<void> {
    const { mimeType } = analysis;
    
    if (ContentAnalysisService.SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      await this.extractImageContent(file, analysis);
    } else if (ContentAnalysisService.SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) {
      await this.extractDocumentContent(file, analysis);
    } else if (ContentAnalysisService.TEXT_TYPES.includes(mimeType) || this.isCodeFile(file.name)) {
      await this.extractTextContent(file, analysis);
    } else if (mimeType.startsWith('audio/')) {
      await this.extractAudioMetadata(file, analysis);
    } else if (mimeType.startsWith('video/')) {
      await this.extractVideoMetadata(file, analysis);
    } else {
      // Binary or unknown file type
      await this.extractBinaryMetadata(file, analysis);
    }
  }

  private async extractImageContent(file: File, analysis: ContentAnalysis): Promise<void> {
    try {
      console.log('Extracting OCR text from image...');
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log('OCR Progress:', m)
      });
      
      analysis.ocrText = text.trim();
      analysis.extractedText = text.trim();
      analysis.metadata.hasText = text.trim().length > 0;
      analysis.metadata.imageSize = await this.getImageDimensions(file);
      
      console.log('OCR extraction completed, text length:', text.length);
    } catch (error) {
      console.error('OCR extraction failed:', error);
      analysis.extractedText = `Image file: ${file.name}`;
      analysis.metadata.ocrError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private async extractDocumentContent(file: File, analysis: ContentAnalysis): Promise<void> {
    try {
      if (file.type === 'application/pdf') {
        await this.extractPDFContent(file, analysis);
      } else if (file.type.includes('wordprocessingml') || file.type === 'application/msword') {
        await this.extractWordContent(file, analysis);
      }
    } catch (error) {
      console.error('Document extraction failed:', error);
      analysis.extractedText = `Document file: ${file.name}`;
      analysis.metadata.extractionError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private async extractPDFContent(file: File, analysis: ContentAnalysis): Promise<void> {
    // For PDF parsing, we'll use a simple text extraction approach
    // In a production environment, you'd want to use pdf-parse or similar
    const arrayBuffer = await file.arrayBuffer();
    const text = await this.extractTextFromPDF(arrayBuffer);
    analysis.extractedText = text;
    analysis.metadata.pageCount = this.estimatePageCount(text);
  }

  private async extractWordContent(file: File, analysis: ContentAnalysis): Promise<void> {
    // For Word documents, we'll extract what we can
    // In production, you'd use mammoth.js or similar
    const arrayBuffer = await file.arrayBuffer();
    const text = await this.extractTextFromWord(arrayBuffer);
    analysis.extractedText = text;
  }

  private async extractTextContent(file: File, analysis: ContentAnalysis): Promise<void> {
    const text = await file.text();
    analysis.extractedText = text;
    analysis.metadata.lineCount = text.split('\n').length;
    analysis.metadata.wordCount = text.split(/\s+/).length;
    
    if (this.isCodeFile(file.name)) {
      analysis.metadata.codeLanguage = this.detectCodeLanguage(file.name, text);
      analysis.metadata.isCode = true;
    }
  }

  private async extractAudioMetadata(file: File, analysis: ContentAnalysis): Promise<void> {
    analysis.extractedText = `Audio file: ${file.name}`;
    analysis.metadata.duration = await this.getAudioDuration(file);
    analysis.metadata.isAudio = true;
  }

  private async extractVideoMetadata(file: File, analysis: ContentAnalysis): Promise<void> {
    analysis.extractedText = `Video file: ${file.name}`;
    analysis.metadata.duration = await this.getVideoDuration(file);
    analysis.metadata.isVideo = true;
  }

  private async extractBinaryMetadata(file: File, analysis: ContentAnalysis): Promise<void> {
    analysis.extractedText = `Binary file: ${file.name}`;
    analysis.metadata.isBinary = true;
    analysis.metadata.possibleType = this.guessBinaryType(file.name);
  }

  private async getAIClassification(analysis: ContentAnalysis, provider: AIProvider): Promise<AIClassificationResult> {
    const prompt = this.buildClassificationPrompt(analysis);
    
    try {
      console.log('Sending content to AI for classification...');
      const response = await aiService.analyzeFiles([{
        name: analysis.metadata.name,
        type: analysis.mimeType,
        size: analysis.metadata.size,
        lastModified: analysis.metadata.lastModified,
        content: analysis.contentPreview
      } as any], provider);

      return this.parseAIClassificationResponse(response);
    } catch (error) {
      console.error('AI classification failed:', error);
      return this.getFallbackClassification(analysis);
    }
  }

  private buildClassificationPrompt(analysis: ContentAnalysis): string {
    return `Analyze this file content and provide categorization recommendations:

File: ${analysis.metadata.name}
Type: ${analysis.fileType}
MIME: ${analysis.mimeType}
Size: ${analysis.metadata.size} bytes

Content Preview (first 1000 characters):
${analysis.contentPreview}

${analysis.ocrText ? `OCR Text: ${analysis.ocrText.substring(0, 500)}` : ''}

Please provide a JSON response with:
{
  "recommendedCategory": "Documents/Images/Code/Media/Archive/Other",
  "recommendedFolder": "specific folder name based on content",
  "contentType": "brief description of what this file contains",
  "tags": ["relevant", "tags", "for", "organization"],
  "confidence": 0.85,
  "reasoning": "why you chose this categorization",
  "isSensitive": false,
  "language": "detected language if applicable"
}

Focus on the actual content meaning, not just file extension. Consider:
- Document type and subject matter
- Code language and purpose
- Image content and context
- Media type and likely use
- Sensitivity of information`;
  }

  private parseAIClassificationResponse(response: any): AIClassificationResult {
    try {
      // Extract JSON from the AI response
      const jsonMatch = response.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          recommendedCategory: parsed.recommendedCategory || 'Other',
          recommendedFolder: parsed.recommendedFolder || 'Unsorted',
          contentType: parsed.contentType || 'Unknown content',
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
          reasoning: parsed.reasoning || 'No reasoning provided',
          isSensitive: Boolean(parsed.isSensitive),
          language: parsed.language
        };
      }
    } catch (error) {
      console.error('Failed to parse AI classification response:', error);
    }
    
    return this.getFallbackClassification({ mimeType: '', fileType: 'Unknown' } as ContentAnalysis);
  }

  private getFallbackClassification(analysis: ContentAnalysis): AIClassificationResult {
    const category = this.getFallbackCategory(analysis.mimeType, analysis.fileType);
    return {
      recommendedCategory: category,
      recommendedFolder: category,
      contentType: `${analysis.fileType} file`,
      tags: [analysis.fileType.toLowerCase()],
      confidence: 0.3,
      reasoning: 'Fallback classification based on file type',
      isSensitive: false
    };
  }

  private getFallbackCategory(mimeType: string, fileType: string): string {
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'Documents';
    if (this.isCodeFile(mimeType)) return 'Code';
    return 'Other';
  }

  private generateContentPreview(text: string): string {
    if (!text) return '';
    return text.substring(0, ContentAnalysisService.CONTENT_PREVIEW_LENGTH).trim();
  }

  private calculateConfidence(analysis: ContentAnalysis): number {
    let confidence = 0.5; // Base confidence
    
    if (analysis.extractedText.length > 0) confidence += 0.3;
    if (analysis.aiClassification) confidence += analysis.aiClassification.confidence * 0.4;
    if (analysis.ocrText && analysis.ocrText.length > 10) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private getFileCategory(file: File): string {
    const { type, name } = file;
    
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.includes('pdf')) return 'PDF Document';
    if (type.includes('document') || type.includes('word')) return 'Word Document';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'Spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'Presentation';
    if (this.isCodeFile(name)) return 'Code File';
    if (type.startsWith('text/')) return 'Text File';
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return 'Archive';
    
    return 'Unknown';
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  private isCodeFile(filename: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return ContentAnalysisService.CODE_EXTENSIONS.includes(ext);
  }

  private detectCodeLanguage(filename: string, content: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript React',
      '.jsx': 'JavaScript React',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin'
    };
    
    return languageMap[ext] || 'Unknown';
  }

  // Helper methods for file processing
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });
  }

  private async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(file);
    });
  }

  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  }

  private async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    // Basic PDF text extraction (simplified)
    // In production, use pdf-parse or similar library
    const text = new TextDecoder().decode(arrayBuffer);
    const matches = text.match(/\(([^)]+)\)/g);
    return matches ? matches.map(m => m.slice(1, -1)).join(' ') : 'PDF content extraction not available';
  }

  private async extractTextFromWord(arrayBuffer: ArrayBuffer): Promise<string> {
    // Basic Word document text extraction (simplified)
    // In production, use mammoth.js
    return 'Word document content extraction not available in basic implementation';
  }

  private estimatePageCount(text: string): number {
    // Rough estimation: ~500 characters per page
    return Math.max(1, Math.ceil(text.length / 500));
  }

  private guessBinaryType(filename: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    const typeMap: Record<string, string> = {
      '.exe': 'Executable',
      '.dll': 'Library',
      '.so': 'Shared Object',
      '.dylib': 'Dynamic Library',
      '.bin': 'Binary Data',
      '.dat': 'Data File',
      '.db': 'Database',
      '.sqlite': 'SQLite Database'
    };
    
    return typeMap[ext] || 'Binary File';
  }
}

export const contentAnalysisService = new ContentAnalysisService();