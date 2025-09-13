import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AIProvider, ArchivePlan, ActivityRecord, SavedArchivePlan, ActivityType, OperationStatus } from '@/types/archiver';
import { loadState, saveState } from '@/services/storage';
import { addActivity } from '@/services/activityManager';

interface AppContextType {
  state: AppState;
  setCurrentProvider: (provider: AIProvider | null) => void;
  updateProvider: (providerId: string, updates: Partial<AIProvider>) => void;
  setCurrentPlan: (plan: ArchivePlan | null) => void;
  savePlan: (name: string, plan: ArchivePlan) => void;
  deleteSavedPlan: (planId: string) => void;
  addActivityRecord: (activity: Omit<ActivityRecord, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  setAnalyzing: (analyzing: boolean) => void;
  setPlanExecuting: (executing: boolean) => void;
}

type AppAction =
  | { type: 'SET_CURRENT_PROVIDER'; payload: AIProvider | null }
  | { type: 'UPDATE_PROVIDER'; payload: { providerId: string; updates: Partial<AIProvider> } }
  | { type: 'SET_CURRENT_PLAN'; payload: ArchivePlan | null }
  | { type: 'SAVE_PLAN'; payload: SavedArchivePlan }
  | { type: 'DELETE_SAVED_PLAN'; payload: string }
  | { type: 'ADD_ACTIVITY'; payload: ActivityRecord }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_PLAN_EXECUTING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

const initialState: AppState = {
  currentProvider: null,
  providers: [
    { id: 'openai', name: 'OpenAI', apiKey: '', isConnected: false },
    { id: 'openrouter', name: 'OpenRouter', apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-4-maverick:free', isConnected: false },
    { id: 'ollama', name: 'Ollama', apiKey: '', baseUrl: 'http://localhost:11434', isConnected: false }
  ],
  currentPlan: null,
  savedPlans: [],
  activityHistory: [],
  isAnalyzing: false,
  isPlanExecuting: false
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_PROVIDER':
      return { ...state, currentProvider: action.payload };
    
    case 'UPDATE_PROVIDER':
      return {
        ...state,
        providers: state.providers.map(provider =>
          provider.id === action.payload.providerId
            ? { ...provider, ...action.payload.updates }
            : provider
        )
      };
    
    case 'SET_CURRENT_PLAN':
      return { ...state, currentPlan: action.payload };
    
    case 'SAVE_PLAN':
      return {
        ...state,
        savedPlans: [...state.savedPlans, action.payload]
      };
    
    case 'DELETE_SAVED_PLAN':
      return {
        ...state,
        savedPlans: state.savedPlans.filter(plan => plan.id !== action.payload)
      };
    
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activityHistory: [action.payload, ...state.activityHistory.slice(0, 99)] // Keep last 100 activities
      };
    
    case 'CLEAR_HISTORY':
      return { ...state, activityHistory: [] };
    
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    
    case 'SET_PLAN_EXECUTING':
      return { ...state, isPlanExecuting: action.payload };
    
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = loadState();
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: savedState });
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const setCurrentProvider = (provider: AIProvider | null) => {
    dispatch({ type: 'SET_CURRENT_PROVIDER', payload: provider });
  };

  const updateProvider = (providerId: string, updates: Partial<AIProvider>) => {
    dispatch({ type: 'UPDATE_PROVIDER', payload: { providerId, updates } });
    
    // If this provider is now connected, set it as current
    if (updates.isConnected) {
      const updatedProvider = state.providers.find(p => p.id === providerId);
      if (updatedProvider) {
        setCurrentProvider({ ...updatedProvider, ...updates });
      }
    }
  };

  const setCurrentPlan = (plan: ArchivePlan | null) => {
    dispatch({ type: 'SET_CURRENT_PLAN', payload: plan });
  };

  const savePlan = (name: string, plan: ArchivePlan) => {
    const savedPlan: SavedArchivePlan = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      plan
    };
    dispatch({ type: 'SAVE_PLAN', payload: savedPlan });
    addActivityRecord({
      type: ActivityType.PLAN_SAVED,
      status: OperationStatus.COMPLETED,
      title: 'Plan Saved',
      description: `Archive plan "${name}" saved successfully`,
      metadata: { planId: savedPlan.id }
    });
  };

  const deleteSavedPlan = (planId: string) => {
    dispatch({ type: 'DELETE_SAVED_PLAN', payload: planId });
  };

  const addActivityRecord = (activity: Omit<ActivityRecord, 'id' | 'timestamp'>) => {
    const record = addActivity(activity);
    dispatch({ type: 'ADD_ACTIVITY', payload: record });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  const setAnalyzing = (analyzing: boolean) => {
    dispatch({ type: 'SET_ANALYZING', payload: analyzing });
  };

  const setPlanExecuting = (executing: boolean) => {
    dispatch({ type: 'SET_PLAN_EXECUTING', payload: executing });
  };

  return (
    <AppContext.Provider value={{
      state,
      setCurrentProvider,
      updateProvider,
      setCurrentPlan,
      savePlan,
      deleteSavedPlan,
      addActivityRecord,
      clearHistory,
      setAnalyzing,
      setPlanExecuting
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};