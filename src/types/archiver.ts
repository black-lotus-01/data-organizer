export interface FileMetadata {
  path: string;
  mime: string;
  size: number;
  mtime: string;
  sha256: string;
  excerpt: string;
  metadata?: Record<string, any>;
  contentAnalysis?: any;
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

export enum ActivityType {
  FILE_UPLOAD = 'file_upload',
  FILE_ANALYSIS = 'file_analysis',
  PLAN_GENERATED = 'plan_generated',
  PLAN_SAVED = 'plan_saved',
  PLAN_EXECUTED = 'plan_executed',
  PLAN_CANCELLED = 'plan_cancelled',
  AI_CONNECTED = 'ai_connected',
  AI_DISCONNECTED = 'ai_disconnected',
  FOLDER_CREATED = 'folder_created',
  FILE_MOVED = 'file_moved',
  ERROR = 'error'
}

export enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ROLLED_BACK = 'rolled_back'
}

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  timestamp: string;
  status: OperationStatus;
  title: string;
  description: string;
  metadata?: {
    fileCount?: number;
    folderCount?: number;
    provider?: string;
    planId?: string;
    error?: string;
    hash?: string;
  };
}

export interface SavedArchivePlan {
  id: string;
  name: string;
  createdAt: string;
  plan: ArchivePlan;
}

export interface AppState {
  currentProvider: AIProvider | null;
  providers: AIProvider[];
  currentPlan: ArchivePlan | null;
  savedPlans: SavedArchivePlan[];
  activityHistory: ActivityRecord[];
  isAnalyzing: boolean;
  isPlanExecuting: boolean;
}