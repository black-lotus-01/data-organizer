import { useState } from "react";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { ArchivePlanView } from "@/components/ArchivePlanView";
import { AISettings } from "@/components/Settings/AISettings";
import SavedPlans from "@/components/SavedPlans";
import ActivityHistory from "@/components/ActivityHistory";
import PlanExecutor from "@/components/PlanExecutor";
import { LocationPicker } from "@/components/LocationPicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FolderOpen, Sparkles, FileSearch, Settings, History, Archive, Play } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { formatActivityTime, getActivityIcon } from "@/services/activityManager";

const Index = () => {
  const { state, setCurrentPlan } = useApp();
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'plan' | 'settings' | 'activity' | 'saved-plans' | 'executor'>('home');

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="space-y-6">
            <LocationPicker onLocationSelected={() => {}} />
            <FileUpload />
          </div>
        );
      case 'plan':
        return state.currentPlan ? (
          <ArchivePlanView
            plan={state.currentPlan}
            onExecute={() => setCurrentView('executor')}
            onCancel={() => {
              setCurrentPlan(null);
              setCurrentView('home');
            }}
          />
        ) : null;
      case 'executor':
        return state.currentPlan ? (
          <PlanExecutor
            plan={state.currentPlan}
            onComplete={() => {
              setCurrentPlan(null);
              setCurrentView('home');
            }}
            onCancel={() => {
              setCurrentPlan(null);
              setCurrentView('home');
            }}
          />
        ) : null;
      case 'settings':
        return <AISettings />;
      case 'activity':
        return <ActivityHistory />;
      case 'saved-plans':
        return <SavedPlans />;
      default:
        return (
          <div className="space-y-8">
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <FolderOpen className="h-16 w-16 text-primary" />
                  <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4">Smart Archiver</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Intelligent file organization powered by AI. Analyze, categorize, and archive your files with automated precision.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('upload')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileSearch className="h-5 w-5 mr-2" />
                    Organize Files
                  </CardTitle>
                  <CardDescription>
                    Upload files and organize them with AI recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Organizing</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('saved-plans')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Archive className="h-5 w-5 mr-2" />
                    Saved Plans
                  </CardTitle>
                  <CardDescription>
                    Manage your saved archive plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Saved Plans</span>
                    <Badge variant="secondary">{state.savedPlans.length}</Badge>
                  </div>
                  <Button variant="outline" className="w-full">View Plans</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('settings')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Settings
                  </CardTitle>
                  <CardDescription>
                    Configure AI providers and models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Connected Providers</span>
                    <Badge variant="secondary">
                      {state.providers.filter(p => p.isConnected).length}/{state.providers.length}
                    </Badge>
                  </div>
                  <Button variant="outline" className="w-full">Configure</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('activity')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Activity History
                  </CardTitle>
                  <CardDescription>
                    Track all archiving operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Activity Records</span>
                    <Badge variant="secondary">{state.activityHistory.length}</Badge>
                  </div>
                  <Button variant="outline" className="w-full">View History</Button>
                </CardContent>
              </Card>
            </div>

            {state.currentPlan && (
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="h-5 w-5 mr-2 text-primary" />
                    Active Plan Ready
                  </CardTitle>
                  <CardDescription>
                    You have an archive plan ready for execution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{state.currentPlan.summary.total_files}</div>
                      <div className="text-muted-foreground">Files</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{state.currentPlan.summary.recommended_folders}</div>
                      <div className="text-muted-foreground">Folders</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{Math.round(state.currentPlan.metrics.confidence_mean * 100)}%</div>
                      <div className="text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setCurrentView('plan')} className="flex-1">
                      Review Plan
                    </Button>
                    <Button onClick={() => setCurrentView('executor')} variant="outline" className="flex-1">
                      Execute Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="p-8">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default Index;
