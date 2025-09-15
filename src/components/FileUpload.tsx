import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, FolderOpen, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileMetadata, ArchivePlan, OperationStatus } from '@/types/archiver';
import { useApp } from '@/contexts/AppContext';
import { aiService } from '@/services/aiService';
import { fileOrganizer } from '@/services/fileOrganizer';
import { LocationPicker } from '@/components/LocationPicker';
import { createFileUploadActivity, createAnalysisActivity, createPlanGeneratedActivity } from '@/services/activityManager';

interface FileUploadProps {
  onFilesAnalyzed?: (plan: ArchivePlan) => void;
}

export const FileUpload = ({ onFilesAnalyzed }: FileUploadProps) => {
  const { state, setAnalyzing, addActivityRecord } = useApp();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [locationSelected, setLocationSelected] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const organizeFiles = async () => {
    if (!state.currentProvider) {
      toast({
        title: "No AI Provider Connected",
        description: "Please connect an AI provider in Settings before organizing files.",
        variant: "destructive"
      });
      return;
    }

    if (!fileOrganizer.isLocationSelected()) {
      toast({
        title: "No Location Selected",
        description: "Please select a location where files will be organized.",
        variant: "destructive"
      });
      return;
    }

    setIsOrganizing(true);
    setProgress(0);

    try {
      // Log file upload activity
      addActivityRecord(createFileUploadActivity(files.length));

      // Create file metadata
      const analyzedFiles: FileMetadata[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const fileContent = await readFileContent(file);
        const sha256 = await generateHash(file);
        
        const metadata: FileMetadata = {
          path: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size,
          mtime: new Date(file.lastModified).toISOString(),
          sha256,
          excerpt: fileContent.substring(0, 300),
          metadata: {
            originalFile: file
          }
        };

        analyzedFiles.push(metadata);
        setProgress(((i + 1) / files.length) * 30); // 30% for file processing
      }

      // Log analysis start
      addActivityRecord(createAnalysisActivity(files.length, OperationStatus.IN_PROGRESS));

      // Get existing folder names from previous organizations
      const existingFolders = Array.from(new Set([
        ...state.savedPlans.flatMap(plan => plan.plan.folders.map(folder => folder.name))
      ]));

      setProgress(40);

      // Get AI folder recommendations
      const recommendations = await aiService.getFolderRecommendations({
        files: analyzedFiles,
        provider: state.currentProvider,
        existingFolders
      });

      setProgress(60);

      toast({
        title: "AI Analysis Complete",
        description: `Got ${recommendations.recommendations.length} folder recommendations`,
      });

      // Organize files using recommendations
      const organizationResult = await fileOrganizer.organizeFiles(
        recommendations.recommendations,
        analyzedFiles
      );

      setProgress(100);

      if (organizationResult.success) {
        addActivityRecord(createAnalysisActivity(files.length, OperationStatus.COMPLETED));
        
        toast({
          title: "Files Organized Successfully!",
          description: `Created ${organizationResult.foldersCreated.length} folders and organized ${organizationResult.filesOrganized} files`,
        });

        // Clear files after successful organization
        setFiles([]);
      } else {
        throw new Error(`Organization completed with errors: ${organizationResult.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('Organization failed:', error);
      
      // Log failed analysis
      addActivityRecord(createAnalysisActivity(
        files.length, 
        OperationStatus.FAILED, 
        error instanceof Error ? error.message : 'Unknown error'
      ));

      toast({
        title: "Organization Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsOrganizing(false);
      setProgress(0);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content || '');
      };
      
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        resolve(`Binary file: ${file.name} (${file.type})`);
      }
    });
  };

  const generateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <LocationPicker onLocationSelected={setLocationSelected} />

      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports all file types for intelligent organization
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FolderOpen className="h-5 w-5 mr-2" />
                Selected Files ({files.length})
              </h3>
              <Button
                onClick={organizeFiles}
                disabled={isOrganizing || !state.currentProvider || !locationSelected}
                className="ml-4"
              >
                {isOrganizing ? 'Organizing...' : 'Organize Files'}
              </Button>
            </div>

            {isOrganizing && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Organizing files...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {!locationSelected && files.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please select an organization location before proceeding
                </p>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.type || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};