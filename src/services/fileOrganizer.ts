import { FileMetadata, ActivityType, OperationStatus } from '@/types/archiver';

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
    fileMetadata: FileMetadata[]
  ): Promise<OrganizationResult> {
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
}

export const fileOrganizer = new FileOrganizer();