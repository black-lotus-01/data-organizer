import { AppState, AIProvider, SavedArchivePlan, ActivityRecord } from '@/types/archiver';

const STORAGE_KEYS = {
  APP_STATE: 'smart-archiver-state',
  PROVIDERS: 'smart-archiver-providers',
  SAVED_PLANS: 'smart-archiver-saved-plans',
  ACTIVITY_HISTORY: 'smart-archiver-activity-history'
};

export const saveState = (state: AppState): void => {
  try {
    // Save essential state data
    const stateToSave = {
      currentProvider: state.currentProvider,
      providers: state.providers,
      savedPlans: state.savedPlans,
      activityHistory: state.activityHistory
    };
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

export const loadState = (): Partial<AppState> | null => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return null;
};

export const saveProviders = (providers: AIProvider[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
  } catch (error) {
    console.error('Failed to save providers to localStorage:', error);
  }
};

export const loadProviders = (): AIProvider[] | null => {
  try {
    const savedProviders = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
    if (savedProviders) {
      return JSON.parse(savedProviders);
    }
  } catch (error) {
    console.error('Failed to load providers from localStorage:', error);
  }
  return null;
};

export const savePlans = (plans: SavedArchivePlan[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(plans));
  } catch (error) {
    console.error('Failed to save plans to localStorage:', error);
  }
};

export const loadPlans = (): SavedArchivePlan[] | null => {
  try {
    const savedPlans = localStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
    if (savedPlans) {
      return JSON.parse(savedPlans);
    }
  } catch (error) {
    console.error('Failed to load plans from localStorage:', error);
  }
  return null;
};

export const saveActivityHistory = (activities: ActivityRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_HISTORY, JSON.stringify(activities));
  } catch (error) {
    console.error('Failed to save activity history to localStorage:', error);
  }
};

export const loadActivityHistory = (): ActivityRecord[] | null => {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.ACTIVITY_HISTORY);
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
  } catch (error) {
    console.error('Failed to load activity history from localStorage:', error);
  }
  return null;
};

export const clearStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};