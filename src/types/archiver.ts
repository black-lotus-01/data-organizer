export interface FileMetadata {
  path: string;
  mime: string;
  size: number;
  mtime: string;
  sha256: string;
  excerpt: string;
  metadata?: Record<string, any>;
}

export interface ArchiveConfig {
  auto_confirm?: boolean;
  confidence_threshold?: number;
  max_folders?: number;
  allow_transforms?: {
    ocr: boolean;
    transcribe: boolean;
  };
  dedupe_strategy?: 'link' | 'keep-one' | 'keep-all';
  verbose?: boolean;
  naming_style?: 'topic-first' | 'date-first' | 'type-first';
  max_folder_name_length?: number;
}

export interface InputContext {
  root_path: string;
  files: FileMetadata[];
  config: ArchiveConfig;
}

export interface FolderPlan {
  name: string;
  display_name?: string;
  rationale: string;
  confidence: number;
  rules?: string[];
  files: {
    path: string;
    action: 'move' | 'copy' | 'link' | 'ignore';
    reason: string;
    confidence: number;
  }[];
}

export interface Operation {
  op: 'create_folder' | 'move' | 'copy' | 'link' | 'convert' | 'skip';
  target: string;
  items: string[];
  note?: string;
  estimated_effect: {
    size_change: number;
  };
}

export interface DuplicateInfo {
  sha256: string;
  locations: string[];
  suggestion: string;
  confidence: number;
}

export interface SensitiveFile {
  path: string;
  type: 'private-key' | 'password-file' | 'ssn' | 'medical' | 'financial';
  advice: string;
}

export interface ArchivePlan {
  root_path: string;
  summary: {
    total_files: number;
    total_size: number;
    detected_topics: string[];
    sensitive_count: number;
    recommended_folders: number;
  };
  folders: FolderPlan[];
  operations: Operation[];
  dedupe: {
    duplicates: DuplicateInfo[];
    strategy_used: string;
  };
  sensitive: SensitiveFile[];
  rollback: {
    instructions: string[];
    timestamped_log_reference: string;
  };
  metrics: {
    confidence_mean: number;
    folders_created: number;
    files_moved: number;
  };
  errors: string[];
  config_used: ArchiveConfig;
}

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  isConnected: boolean;
}