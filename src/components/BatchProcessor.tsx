import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { useApp } from '@/contexts/AppContext';
import { processFileForAnalysis } from '@/services/aiService';
import { createOrganizedFolders } from '@/services/fileOrganizer';
import { toast } from 'sonner';
import { Play, Pause, Square, FolderPlus, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface BatchFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  recommendation?: string;
  error?: string;
}

export default function BatchProcessor() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const { state } = useApp();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: BatchFile[] = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`Added ${acceptedFiles.length} files to batch queue`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'text/*': ['.txt', '.md', '.json', '.csv'],
      'application/*': ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'video/*': ['.mp4', '.avi', '.mov']
    }
  });

  const processBatch = async () => {
    if (!state.currentProvider?.isConnected) {
      toast.error('Please configure an AI provider first');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    
    for (let i = currentFileIndex; i < files.length; i++) {
      if (isPaused) break;
      
      setCurrentFileIndex(i);
      const file = files[i];
      
      try {
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' } : f
        ));

        // Process file
        const analysis = await processFileForAnalysis(file.file, state.currentProvider);
        
        // Update file with recommendation
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'completed', 
            recommendation: analysis.recommendedFolder 
          } : f
        ));

        // Update progress
        setProgress(((i + 1) / files.length) * 100);
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Processing failed' 
          } : f
        ));
      }
    }

    if (!isPaused) {
      setIsProcessing(false);
      setCurrentFileIndex(0);
      toast.success('Batch processing completed!');
    }
  };

  const pauseProcessing = () => {
    setIsPaused(true);
    setIsProcessing(false);
  };

  const resumeProcessing = () => {
    if (currentFileIndex < files.length) {
      processBatch();
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentFileIndex(0);
    setProgress(0);
  };

  const executeOrganization = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.recommendation);
    
    if (completedFiles.length === 0) {
      toast.error('No files ready for organization');
      return;
    }

    try {
      const recommendations = completedFiles.map(f => ({
        file: f.file,
        recommendedFolder: f.recommendation!
      }));

      await createOrganizedFolders(recommendations);
      toast.success(`Organized ${completedFiles.length} files successfully!`);
      
      // Clear completed files
      setFiles(prev => prev.filter(f => f.status !== 'completed'));
      setProgress(0);
      
    } catch (error) {
      toast.error('Failed to organize files');
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setProgress(0);
    setCurrentFileIndex(0);
  };

  const getStatusIcon = (status: BatchFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Batch Processing</h2>
        <p className="text-muted-foreground">Process multiple files simultaneously for efficient organization</p>
      </div>

      {/* Upload Area */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-foreground font-medium mb-2">Drag & drop files here, or click to select</p>
                <p className="text-sm text-muted-foreground">Supports documents, images, audio, video files</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Processing Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Batch Control
                <div className="flex gap-2">
                  <Badge variant="secondary">{files.length} files</Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Control the batch processing of your files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <div className="flex gap-2">
                {!isProcessing && !isPaused && (
                  <Button onClick={processBatch} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Start Processing
                  </Button>
                )}
                
                {isProcessing && (
                  <Button onClick={pauseProcessing} variant="outline" className="flex-1">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                {isPaused && (
                  <Button onClick={resumeProcessing} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                
                {(isProcessing || isPaused) && (
                  <Button onClick={stopProcessing} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>

              {completedCount > 0 && (
                <Button onClick={executeOrganization} variant="outline" className="w-full">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Organize {completedCount} Files
                </Button>
              )}

              <Button onClick={clearFiles} variant="ghost" className="w-full">
                Clear All Files
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-success">{completedCount}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{errorCount}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">{pendingCount}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{files.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>File Queue</CardTitle>
            <CardDescription>Track the processing status of each file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    currentFileIndex === index && isProcessing ? 'bg-primary/5 border-primary' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(file.status)}
                    <div>
                      <div className="font-medium text-sm">{file.file.name}</div>
                      {file.recommendation && (
                        <div className="text-xs text-muted-foreground">
                          → {file.recommendation}
                        </div>
                      )}
                      {file.error && (
                        <div className="text-xs text-destructive">
                          Error: {file.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      file.status === 'completed' ? 'default' :
                      file.status === 'error' ? 'destructive' :
                      file.status === 'processing' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {file.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}