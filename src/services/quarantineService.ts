import { ThreatAnalysis } from './virusTotalService';

export interface QuarantinedFile {
  id: string;
  fileName: string;
  originalPath: string;
  quarantineDate: string;
  threatAnalysis: ThreatAnalysis;
  fileBlob: Blob;
  status: 'quarantined' | 'restored' | 'deleted';
  notes?: string;
}

class QuarantineService {
  private static readonly STORAGE_KEY = 'quarantined_files';
  private quarantinedFiles: Map<string, QuarantinedFile> = new Map();

  constructor() {
    this.loadQuarantinedFiles();
  }

  async quarantineFile(
    file: File, 
    threatAnalysis: ThreatAnalysis, 
    originalPath?: string
  ): Promise<string> {
    const quarantineId = this.generateQuarantineId();
    
    const quarantinedFile: QuarantinedFile = {
      id: quarantineId,
      fileName: file.name,
      originalPath: originalPath || file.name,
      quarantineDate: new Date().toISOString(),
      threatAnalysis,
      fileBlob: file,
      status: 'quarantined',
      notes: `Auto-quarantined due to ${threatAnalysis.threatLevel} threat level`
    };

    this.quarantinedFiles.set(quarantineId, quarantinedFile);
    await this.saveQuarantinedFiles();
    
    return quarantineId;
  }

  getQuarantinedFiles(): QuarantinedFile[] {
    return Array.from(this.quarantinedFiles.values())
      .sort((a, b) => new Date(b.quarantineDate).getTime() - new Date(a.quarantineDate).getTime());
  }

  getQuarantinedFile(id: string): QuarantinedFile | undefined {
    return this.quarantinedFiles.get(id);
  }

  async restoreFile(id: string, notes?: string): Promise<boolean> {
    const file = this.quarantinedFiles.get(id);
    if (!file) return false;

    file.status = 'restored';
    file.notes = notes || 'File manually restored by user';
    
    await this.saveQuarantinedFiles();
    return true;
  }

  async deleteQuarantinedFile(id: string, notes?: string): Promise<boolean> {
    const file = this.quarantinedFiles.get(id);
    if (!file) return false;

    file.status = 'deleted';
    file.notes = notes || 'File permanently deleted from quarantine';
    
    // Keep record but remove blob to save space
    file.fileBlob = new Blob([]);
    
    await this.saveQuarantinedFiles();
    return true;
  }

  async downloadQuarantinedFile(id: string): Promise<void> {
    const file = this.quarantinedFiles.get(id);
    if (!file || file.status === 'deleted') {
      throw new Error('File not available for download');
    }

    const url = URL.createObjectURL(file.fileBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QUARANTINED_${file.fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getQuarantineStats() {
    const files = this.getQuarantinedFiles();
    return {
      total: files.length,
      active: files.filter(f => f.status === 'quarantined').length,
      restored: files.filter(f => f.status === 'restored').length,
      deleted: files.filter(f => f.status === 'deleted').length,
      malicious: files.filter(f => f.threatAnalysis.threatLevel === 'malicious').length,
      suspicious: files.filter(f => f.threatAnalysis.threatLevel === 'suspicious').length
    };
  }

  private generateQuarantineId(): string {
    return `quar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveQuarantinedFiles(): Promise<void> {
    try {
      // Convert Map to array for storage, excluding large blobs for the index
      const filesIndex = Array.from(this.quarantinedFiles.entries()).map(([id, file]) => ({
        id,
        fileName: file.fileName,
        originalPath: file.originalPath,
        quarantineDate: file.quarantineDate,
        threatAnalysis: file.threatAnalysis,
        status: file.status,
        notes: file.notes
      }));
      
      localStorage.setItem(QuarantineService.STORAGE_KEY, JSON.stringify(filesIndex));
      
      // Store file blobs separately using IndexedDB would be better for large files
      // For now, we'll keep them in memory only
    } catch (error) {
      console.error('Failed to save quarantined files:', error);
    }
  }

  private loadQuarantinedFiles(): void {
    try {
      const stored = localStorage.getItem(QuarantineService.STORAGE_KEY);
      if (stored) {
        const filesIndex = JSON.parse(stored);
        // Note: File blobs are not persisted across sessions for security
        // In a production app, you'd use IndexedDB or similar
        filesIndex.forEach((fileData: any) => {
          if (fileData.status !== 'deleted') {
            this.quarantinedFiles.set(fileData.id, {
              ...fileData,
              fileBlob: new Blob([]) // Empty blob as placeholder
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load quarantined files:', error);
    }
  }
}

export const quarantineService = new QuarantineService();
