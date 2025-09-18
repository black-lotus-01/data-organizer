import { FileMetadata, ActivityType, OperationStatus, AIProvider } from '@/types/archiver';
import { virusTotalService } from './virusTotalService';
import { quarantineService } from './quarantineService';
import { contentAnalysisService } from './contentAnalysisService';
import { toast } from '@/hooks/use-toast';

// File System Access API types
declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write(data: FileSystemWriteChunkType): Promise<void>;
  close(): Promise<void>;
}

type FileSystemWriteChunkType = BufferSource | Blob | string;

export interface OrganizationResult {
  success: boolean;
  foldersCreated: string[];
  filesOrganized: number;
  errors: string[];
}

export interface OrganizeOptions {
  enableSecurity?: boolean;
  securityLevel?: 'basic' | 'strict';
  enableContentAnalysis?: boolean;
  aiProvider?: AIProvider;
}

export interface FolderRecommendation {
  folderName: string;
  files: string[];
  reason: string;
  confidence: number;
}

class FileOrganizer {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private createdFolders: Set<string> = new Set();

  async selectOrganizationLocation(): Promise<boolean> {
    try {
      // Check if File System Access API is supported
      if (!window.showDirectoryPicker) {
        throw new Error('File System Access API is not supported in this browser');
      }

      // Use File System Access API to let user choose directory
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      return true;
    } catch (error) {
      console.error('Failed to select directory:', error);
      return false;
    }
  }

  async organizeFiles(
    recommendations: FolderRecommendation[], 
    fileMetadata: FileMetadata[],
    options: OrganizeOptions = {}
  ): Promise<OrganizationResult> {
    // Security scan for executable files before organization
    await this.performSecurityScan(fileMetadata);
    
    // Enhanced content analysis
    if (options.enableContentAnalysis && options.aiProvider) {
      await this.performContentAnalysis(fileMetadata, options.aiProvider);
    }
    
    if (!this.directoryHandle) {
      throw new Error('No organization location selected');
    }

    const result: OrganizationResult = {
      success: true,
      foldersCreated: [],
      filesOrganized: 0,
      errors: []
    };

    try {
      // Create folders and organize files
      for (const recommendation of recommendations) {
        try {
          // Create folder if it doesn't exist
          const folderName = this.sanitizeFolderName(recommendation.folderName);
          
          let folderHandle: FileSystemDirectoryHandle;
          if (!this.createdFolders.has(folderName)) {
            try {
              folderHandle = await this.directoryHandle.getDirectoryHandle(folderName);
            } catch {
              // Folder doesn't exist, create it
              folderHandle = await this.directoryHandle.getDirectoryHandle(folderName, { create: true });
              this.createdFolders.add(folderName);
              result.foldersCreated.push(folderName);
            }
          } else {
            folderHandle = await this.directoryHandle.getDirectoryHandle(folderName);
          }

          // Move files to folder
          for (const fileName of recommendation.files) {
            try {
              const fileMetaData = fileMetadata.find(f => f.path === fileName);
              if (fileMetaData?.metadata?.originalFile) {
                const file = fileMetaData.metadata.originalFile as File;
                
                // Create file in the folder
                const fileHandle = await folderHandle.getFileHandle(file.name, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(file);
                await writable.close();
                
                result.filesOrganized++;
              }
            } catch (error) {
              const errorMsg = `Failed to organize file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              result.errors.push(errorMsg);
              console.error(errorMsg);
            }
          }
        } catch (error) {
          const errorMsg = `Failed to create folder ${recommendation.folderName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Organization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  private sanitizeFolderName(name: string): string {
    // Remove invalid characters and limit length
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50)
      .toLowerCase();
  }

  isLocationSelected(): boolean {
    return this.directoryHandle !== null;
  }

  getSelectedLocation(): string {
    return this.directoryHandle?.name || 'No location selected';
  }

  reset() {
    this.directoryHandle = null;
    this.createdFolders.clear();
  }

  private async performSecurityScan(fileMetadata: FileMetadata[]): Promise<void> {
    const executableFiles = fileMetadata.filter(file => 
      virusTotalService.isExecutableFile(file.path)
    );

    if (executableFiles.length === 0) {
      return; // No executable files to scan
    }

    const apiKey = virusTotalService.getApiKey();
    if (!apiKey) {
      toast({
        title: "Security Warning",
        description: `${executableFiles.length} executable files detected. Configure VirusTotal API for security scanning.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Security Scan",
      description: `Scanning ${executableFiles.length} executable files for threats...`,
    });

    for (const fileMetadata of executableFiles) {
      try {
        // Get the actual file from metadata if available
        const originalFile = fileMetadata.metadata?.originalFile as File;
        if (!originalFile) continue;

        const threatAnalysis = await virusTotalService.scanFile(originalFile);
        
        if (threatAnalysis.isMalicious || threatAnalysis.threatLevel === 'suspicious') {
          // Quarantine suspicious/malicious files
          const quarantineId = await quarantineService.quarantineFile(
            originalFile,
            threatAnalysis,
            fileMetadata.path
          );
          
          toast({
            title: "Threat Detected",
            description: `File ${fileMetadata.path} has been quarantined (${threatAnalysis.threatLevel})`,
            variant: "destructive",
          });
          
          // Remove from organization process
          const index = executableFiles.indexOf(fileMetadata);
          if (index > -1) {
            executableFiles.splice(index, 1);
          }
        }
      } catch (error) {
        console.error(`Security scan failed for ${fileMetadata.path}:`, error);
        toast({
          title: "Scan Error",
          description: `Failed to scan ${fileMetadata.path}. File will be processed without security check.`,
          variant: "destructive",
        });
      }
    }
  }

  private async performContentAnalysis(fileMetadata: FileMetadata[], aiProvider: AIProvider): Promise<void> {
    console.log('Performing enhanced content analysis...');
    
    for (const file of fileMetadata) {
      try {
        const originalFile = file.metadata?.originalFile as File;
        if (!originalFile) continue;

        const contentAnalysis = await contentAnalysisService.analyzeFile(originalFile, aiProvider);
        file.contentAnalysis = contentAnalysis;
        
        console.log(`Content analysis completed for ${file.path}:`, {
          fileType: contentAnalysis.fileType,
          confidence: contentAnalysis.confidence,
          aiClassification: contentAnalysis.aiClassification?.recommendedCategory
        });
        
      } catch (error) {
        console.error(`Content analysis failed for ${file.path}:`, error);
      }
    }
  }
}

export const fileOrganizer = new FileOrganizer();

// Helper function for batch processing
export async function createOrganizedFolders(
  recommendations: Array<{ file: File; recommendedFolder: string }>
): Promise<void> {
  if (!fileOrganizer.isLocationSelected()) {
    throw new Error('Please select an organization location first');
  }

  // Convert to the format expected by organizeFiles
  const folderMap = new Map<string, File[]>();
  
  for (const rec of recommendations) {
    if (!folderMap.has(rec.recommendedFolder)) {
      folderMap.set(rec.recommendedFolder, []);
    }
    folderMap.get(rec.recommendedFolder)!.push(rec.file);
  }

  const folderRecommendations: FolderRecommendation[] = Array.from(folderMap.entries()).map(([folderName, files]) => ({
    folderName,
    files: files.map(f => f.name),
    reason: `Batch processing recommendation`,
    confidence: 0.8
  }));

  const fileMetadata: FileMetadata[] = recommendations.map(rec => ({
    path: rec.file.name,
    size: rec.file.size,
    mime: rec.file.type,
    mtime: new Date(rec.file.lastModified).toISOString(),
    sha256: 'batch-processing-' + Date.now() + '-' + Math.random(), // Placeholder for batch processing
    excerpt: '',
    metadata: { originalFile: rec.file }
  }));

  const result = await fileOrganizer.organizeFiles(folderRecommendations, fileMetadata);
  
  if (!result.success) {
    throw new Error(`Organization failed: ${result.errors.join(', ')}`);
  }
}