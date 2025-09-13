import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, FolderOpen } from 'lucide-react';
import { FileMetadata } from '@/types/archiver';

interface FileUploadProps {
  onFilesAnalyzed: (files: FileMetadata[]) => void;
}

export const FileUpload = ({ onFilesAnalyzed }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const analyzeFiles = async () => {
    setAnalyzing(true);
    setProgress(0);

    const analyzedFiles: FileMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Simulate file analysis
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
      setProgress(((i + 1) / files.length) * 100);
    }

    setAnalyzing(false);
    onFilesAnalyzed(analyzedFiles);
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
                onClick={analyzeFiles}
                disabled={analyzing}
                className="ml-4"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Files'}
              </Button>
            </div>

            {analyzing && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Analyzing files...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
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