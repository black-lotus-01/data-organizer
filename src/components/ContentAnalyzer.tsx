import React, { useState } from 'react';
import { FileText, Brain, Eye, Tag, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { contentAnalysisService, ContentAnalysis } from '@/services/contentAnalysisService';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface ContentAnalyzerProps {
  files: File[];
  onAnalysisComplete?: (results: ContentAnalysis[]) => void;
}

export const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({ 
  files, 
  onAnalysisComplete 
}) => {
  const { state } = useApp();
  const currentProvider = state.currentProvider;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ContentAnalysis[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');

  const startAnalysis = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files",
        description: "Please select files to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResults([]);

    try {
      const results: ContentAnalysis[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file.name);
        setProgress((i / files.length) * 100);

        console.log(`Analyzing file ${i + 1}/${files.length}: ${file.name}`);
        
        const analysis = await contentAnalysisService.analyzeFile(file, currentProvider);
        results.push(analysis);
        
        // Update results incrementally
        setAnalysisResults([...results]);
      }

      setProgress(100);
      onAnalysisComplete?.(results);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${results.length} files`,
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setCurrentFile('');
    }
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'outline';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('Image')) return '🖼️';
    if (fileType.includes('Video')) return '🎥';
    if (fileType.includes('Audio')) return '🎵';
    if (fileType.includes('Document') || fileType.includes('PDF')) return '📄';
    if (fileType.includes('Code')) return '💻';
    return '📁';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Content Analysis</span>
          </CardTitle>
          <CardDescription>
            AI-powered content extraction, OCR, and intelligent categorization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Files to analyze: {files.length}
              </p>
              {currentProvider && (
                <p className="text-xs text-muted-foreground">
                  Using AI Provider: {currentProvider.name}
                </p>
              )}
            </div>
            <Button 
              onClick={startAnalysis} 
              disabled={isAnalyzing || files.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Analyzing: {currentFile}
              </p>
            </div>
          )}

          {!currentProvider && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No AI Provider</AlertTitle>
              <AlertDescription>
                Configure an AI provider in settings for enhanced analysis and categorization.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Analysis Results</h3>
          
          {analysisResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span>{getFileIcon(result.fileType)}</span>
                    <span>{result.metadata.name}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getConfidenceBadgeVariant(result.confidence)}>
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                    {result.aiClassification?.isSensitive && (
                      <Badge variant="destructive">Sensitive</Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  {result.fileType} • {(result.metadata.size / 1024).toFixed(1)} KB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">File Type</p>
                        <p className="text-sm text-muted-foreground">{result.fileType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">MIME Type</p>
                        <p className="text-sm text-muted-foreground">{result.mimeType}</p>
                      </div>
                    </div>
                    
                    {result.aiClassification && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">AI Recommendations</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            📁 {result.aiClassification.recommendedFolder}
                          </Badge>
                          <Badge variant="outline">
                            📋 {result.aiClassification.contentType}
                          </Badge>
                          {result.aiClassification.language && (
                            <Badge variant="outline">
                              🌐 {result.aiClassification.language}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.aiClassification.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-4">
                    {result.ocrText && (
                      <div>
                        <p className="text-sm font-medium mb-2">OCR Extracted Text</p>
                        <Textarea
                          value={result.ocrText}
                          readOnly
                          className="min-h-[100px] text-xs"
                        />
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Content Preview</p>
                      <Textarea
                        value={result.contentPreview || 'No text content extracted'}
                        readOnly
                        className="min-h-[150px] text-xs"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ai-analysis" className="space-y-4">
                    {result.aiClassification ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Recommended Category</p>
                            <p className="text-sm text-muted-foreground">
                              {result.aiClassification.recommendedCategory}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Recommended Folder</p>
                            <p className="text-sm text-muted-foreground">
                              {result.aiClassification.recommendedFolder}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">AI Reasoning</p>
                          <p className="text-sm text-muted-foreground">
                            {result.aiClassification.reasoning}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              AI Confidence: {Math.round(result.aiClassification.confidence * 100)}%
                            </span>
                          </div>
                          {result.aiClassification.isSensitive && (
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600">Sensitive Content</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No AI Analysis</AlertTitle>
                        <AlertDescription>
                          AI analysis not available. Configure an AI provider for enhanced insights.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="metadata" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(result.metadata).map(([key, value]) => (
                        <div key={key}>
                          <p className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-muted-foreground">
                            {typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : String(value)
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};