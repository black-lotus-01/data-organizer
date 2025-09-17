import { toast } from '@/components/ui/use-toast';

export interface VirusTotalScanResult {
  sha256: string;
  scanId: string;
  permalink: string;
  positives: number;
  total: number;
  scanDate: string;
  verbose_msg: string;
  response_code: number;
}

export interface ThreatAnalysis {
  isMalicious: boolean;
  threatLevel: 'clean' | 'suspicious' | 'malicious';
  detectionCount: number;
  totalEngines: number;
  scanResult?: VirusTotalScanResult;
  recommendation: string;
}

class VirusTotalService {
  private static readonly API_BASE_URL = 'https://www.virustotal.com/vtapi/v2';
  private static readonly EXECUTABLE_EXTENSIONS = [
    '.exe', '.dll', '.bat', '.com', '.msi', '.scr', '.ps1', '.elf', '.sh'
  ];

  private apiKey: string | null = null;

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('virustotal_api_key', apiKey);
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('virustotal_api_key');
    }
    return this.apiKey;
  }

  isExecutableFile(filename: string): boolean {
    const extension = this.getFileExtension(filename).toLowerCase();
    return VirusTotalService.EXECUTABLE_EXTENSIONS.includes(extension);
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  async scanFile(file: File): Promise<ThreatAnalysis> {
    if (!this.isExecutableFile(file.name)) {
      return {
        isMalicious: false,
        threatLevel: 'clean',
        detectionCount: 0,
        totalEngines: 0,
        recommendation: 'File type is not executable - no scan needed'
      };
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('VirusTotal API key not configured');
    }

    try {
      // First, get file hash
      const fileHash = await this.calculateFileHash(file);
      
      // Check if file was already scanned
      const existingReport = await this.getFileReport(fileHash);
      if (existingReport) {
        return this.analyzeThreatLevel(existingReport);
      }

      // Upload file for scanning
      const scanResult = await this.uploadFileForScanning(file);
      
      // Wait a bit and then get the report
      await this.delay(5000); // Wait 5 seconds
      const report = await this.getFileReport(fileHash);
      
      if (report) {
        return this.analyzeThreatLevel(report);
      }

      return {
        isMalicious: false,
        threatLevel: 'suspicious',
        detectionCount: 0,
        totalEngines: 0,
        recommendation: 'Scan initiated but results not yet available. Please check again later.'
      };

    } catch (error) {
      console.error('VirusTotal scan failed:', error);
      throw new Error(`Security scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async calculateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async uploadFileForScanning(file: File): Promise<any> {
    const apiKey = this.getApiKey()!;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apikey', apiKey);

    const response = await fetch(`${VirusTotalService.API_BASE_URL}/file/scan`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async getFileReport(fileHash: string): Promise<VirusTotalScanResult | null> {
    const apiKey = this.getApiKey()!;
    
    const response = await fetch(
      `${VirusTotalService.API_BASE_URL}/file/report?apikey=${apiKey}&resource=${fileHash}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Report fetch failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // VirusTotal returns response_code 1 when report is available
    if (result.response_code === 1) {
      return result;
    }
    
    return null;
  }

  private analyzeThreatLevel(scanResult: VirusTotalScanResult): ThreatAnalysis {
    const detectionRatio = scanResult.positives / scanResult.total;
    
    let threatLevel: 'clean' | 'suspicious' | 'malicious';
    let recommendation: string;
    
    if (scanResult.positives === 0) {
      threatLevel = 'clean';
      recommendation = 'File appears to be safe based on security scan results.';
    } else if (detectionRatio < 0.1) {
      threatLevel = 'suspicious';
      recommendation = 'Low-level threat detected. Consider quarantining this file.';
    } else {
      threatLevel = 'malicious';
      recommendation = 'High threat level detected! This file should be quarantined immediately.';
    }

    return {
      isMalicious: scanResult.positives > 0,
      threatLevel,
      detectionCount: scanResult.positives,
      totalEngines: scanResult.total,
      scanResult,
      recommendation
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${VirusTotalService.API_BASE_URL}/file/report?apikey=${apiKey}&resource=test`,
        { method: 'GET' }
      );
      
      // Even invalid resource should return 200 with proper API key
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const virusTotalService = new VirusTotalService();