import { ActivityRecord, ActivityType, OperationStatus } from '@/types/archiver';

export const addActivity = (activity: Omit<ActivityRecord, 'id' | 'timestamp'>): ActivityRecord => {
  const record: ActivityRecord = {
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...activity
  };
  
  return record;
};

export const createFileUploadActivity = (fileCount: number): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: ActivityType.FILE_UPLOAD,
  status: OperationStatus.COMPLETED,
  title: 'Files Uploaded',
  description: `${fileCount} file${fileCount > 1 ? 's' : ''} uploaded for analysis`,
  metadata: { fileCount }
});

export const createAnalysisActivity = (fileCount: number, status: OperationStatus, error?: string): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: ActivityType.FILE_ANALYSIS,
  status,
  title: status === OperationStatus.COMPLETED ? 'Analysis Complete' : 'Analysis Failed',
  description: status === OperationStatus.COMPLETED 
    ? `${fileCount} file${fileCount > 1 ? 's' : ''} analyzed successfully`
    : `Failed to analyze files: ${error || 'Unknown error'}`,
  metadata: { fileCount, ...(error && { error }) }
});

export const createPlanGeneratedActivity = (folderCount: number): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: ActivityType.PLAN_GENERATED,
  status: OperationStatus.COMPLETED,
  title: 'Archive Plan Generated',
  description: `Generated archive plan with ${folderCount} folder${folderCount > 1 ? 's' : ''}`,
  metadata: { folderCount }
});

export const createPlanExecutedActivity = (fileCount: number, folderCount: number): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: ActivityType.PLAN_EXECUTED,
  status: OperationStatus.COMPLETED,
  title: 'Archive Plan Executed',
  description: `Organized ${fileCount} file${fileCount > 1 ? 's' : ''} into ${folderCount} folder${folderCount > 1 ? 's' : ''}`,
  metadata: { fileCount, folderCount }
});

export const createPlanCancelledActivity = (): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: ActivityType.PLAN_CANCELLED,
  status: OperationStatus.CANCELLED,
  title: 'Archive Plan Cancelled',
  description: 'Archive plan was cancelled by user'
});

export const createAIConnectionActivity = (provider: string, status: OperationStatus, error?: string): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: status === OperationStatus.COMPLETED ? ActivityType.AI_CONNECTED : ActivityType.ERROR,
  status,
  title: status === OperationStatus.COMPLETED ? 'AI Provider Connected' : 'Connection Failed',
  description: status === OperationStatus.COMPLETED 
    ? `Successfully connected to ${provider}`
    : `Failed to connect to ${provider}: ${error || 'Unknown error'}`,
  metadata: { provider, ...(error && { error }) }
});

export const createAIDisconnectionActivity = (provider: string): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: ActivityType.AI_DISCONNECTED,
  status: OperationStatus.COMPLETED,
  title: 'AI Provider Disconnected',
  description: `Disconnected from ${provider}`,
  metadata: { provider }
});

export const createErrorActivity = (title: string, error: string): Omit<ActivityRecord, 'id' | 'timestamp'> => ({
  type: ActivityType.ERROR,
  status: OperationStatus.FAILED,
  title,
  description: error,
  metadata: { error }
});

export const formatActivityTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

export const getActivityIcon = (type: ActivityType): string => {
  switch (type) {
    case ActivityType.FILE_UPLOAD:
      return '📁';
    case ActivityType.FILE_ANALYSIS:
      return '🔍';
    case ActivityType.PLAN_GENERATED:
      return '📋';
    case ActivityType.PLAN_SAVED:
      return '💾';
    case ActivityType.PLAN_EXECUTED:
      return '✅';
    case ActivityType.PLAN_CANCELLED:
      return '❌';
    case ActivityType.AI_CONNECTED:
      return '🔗';
    case ActivityType.AI_DISCONNECTED:
      return '🔌';
    case ActivityType.FOLDER_CREATED:
      return '📂';
    case ActivityType.FILE_MOVED:
      return '➡️';
    case ActivityType.ERROR:
      return '⚠️';
    default:
      return '📄';
  }
};