import React, { useState } from 'react';
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { ArchivePlanView } from "@/components/ArchivePlanView";
import { AISettings } from "@/components/Settings/AISettings";
import SavedPlans from "@/components/SavedPlans";
import ActivityHistory from "@/components/ActivityHistory";
import PlanExecutor from "@/components/PlanExecutor";
import BatchProcessor from "@/components/BatchProcessor";
import CustomRules from "@/components/CustomRules";
import AdvancedSearch from "@/components/AdvancedSearch";
import { SecurityDashboard } from "@/components/SecurityDashboard";
import { ContentAnalyzer } from "@/components/ContentAnalyzer";
import { LocationPicker } from "@/components/LocationPicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FolderOpen, Sparkles, FileSearch, Settings, History, Archive, Play, Layers, Search, Zap, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { formatActivityTime, getActivityIcon } from "@/services/activityManager";

const Index = () => {
  const { state, setCurrentPlan } = useApp();
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'plan' | 'settings' | 'activity' | 'saved-plans' | 'executor' | 'batch' | 'rules' | 'search' | 'security' | 'analysis'>('home');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="space-y-6">
            <LocationPicker onLocationSelected={() => {}} />
            <FileUpload onFilesSelected={setSelectedFiles} />
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
      case 'batch':
        return <BatchProcessor />;
      case 'rules':
        return <CustomRules />;
      case 'search':
        return <AdvancedSearch />;
      case 'security':
        return <SecurityDashboard />;
      case 'analysis':
        return <ContentAnalyzer files={selectedFiles} />;
      default:
        return (
          <div className="space-y-8">
            <div className="text-center py-12 animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <FolderOpen className="h-16 w-16 text-primary animate-bounce-soft" />
                  <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse-soft" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Smart Archiver
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Intelligent file organization powered by AI. Analyze, categorize, and archive your files with automated precision.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 animate-slide-in-left">
              <Card className="hover:shadow-lg transition-all hover-scale">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{state.activityHistory.length}</div>
                  <div className="text-sm text-muted-foreground">Total Activities</div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all hover-scale">
                <CardContent className="p-4 text-center">
                  <Archive className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{state.savedPlans.length}</div>
                  <div className="text-sm text-muted-foreground">Saved Plans</div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all hover-scale">
                <CardContent className="p-4 text-center">
                  <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {state.providers.filter(p => p.isConnected).length}
                  </div>
                  <div className="text-sm text-muted-foreground">AI Providers</div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all hover-scale">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Primary Features */}
              <Card className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in" onClick={() => setCurrentView('upload')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileSearch className="h-5 w-5 mr-2 text-primary" />
                    File Upload
                  </CardTitle>
                  <CardDescription>
                    Upload and organize files with AI recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Organizing</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in" onClick={() => setCurrentView('batch')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layers className="h-5 w-5 mr-2 text-purple-500" />
                    Batch Processing
                    <Badge variant="outline" className="ml-2 text-xs animate-pulse-soft">New</Badge>
                  </CardTitle>
                  <CardDescription>
                    Process multiple files simultaneously
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Batch Process</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in" onClick={() => setCurrentView('search')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2 text-blue-500" />
                    Advanced Search
                  </CardTitle>
                  <CardDescription>
                    Search and filter through processed files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Search Files</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in" onClick={() => setCurrentView('rules')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-orange-500" />
                    Custom Rules
                  </CardTitle>
                  <CardDescription>
                    Define custom organization rules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Manage Rules</Button>
                </CardContent>
              </Card>

              {/* Secondary Features */}
              <Card className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in" onClick={() => setCurrentView('saved-plans')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Archive className="h-5 w-5 mr-2 text-green-500" />
                    Saved Plans
                  </CardTitle>
                  <CardDescription>
                    Manage your saved archive plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Plans</span>
                    <Badge variant="secondary">{state.savedPlans.length}</Badge>
                  </div>
                  <Button variant="outline" className="w-full">View Plans</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in" onClick={() => setCurrentView('activity')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="h-5 w-5 mr-2 text-indigo-500" />
                    Activity History
                  </CardTitle>
                  <CardDescription>
                    Track all archiving operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Records</span>
                    <Badge variant="secondary">{state.activityHistory.length}</Badge>
                  </div>
                  <Button variant="outline" className="w-full">View History</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all hover-scale animate-fade-in" onClick={() => setCurrentView('settings')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-pink-500" />
                    AI Settings
                  </CardTitle>
                  <CardDescription>
                    Configure AI providers and models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm">Providers</span>
                    <Badge variant="secondary">
                      {state.providers.filter(p => p.isConnected).length}/{state.providers.length}
                    </Badge>
                  </div>
                  <Button variant="outline" className="w-full">Configure</Button>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest archiving operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.activityHistory.length > 0 ? (
                    <div className="space-y-2">
                      {state.activityHistory.slice(0, 2).map((activity) => (
                        <div key={activity.id} className="text-xs p-2 bg-muted/30 rounded">
                          <div className="flex items-center gap-1 mb-1">
                            {getActivityIcon(activity.type)}
                            <span className="font-medium">{activity.type}</span>
                          </div>
                          <div className="text-muted-foreground truncate">{activity.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </div>
                  )}
                  <Button 
                    onClick={() => setCurrentView('activity')} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                  >
                    View All
                  </Button>
                </CardContent>
              </Card>
            </div>

            {state.currentPlan && (
              <Card className="border-primary bg-primary/5 shadow-lg animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="h-5 w-5 mr-2 text-primary animate-pulse-soft" />
                    Active Plan Ready
                  </CardTitle>
                  <CardDescription>
                    You have an archive plan ready for execution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="font-semibold text-lg">{state.currentPlan.summary.total_files}</div>
                      <div className="text-muted-foreground">Files</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="font-semibold text-lg">{state.currentPlan.summary.recommended_folders}</div>
                      <div className="text-muted-foreground">Folders</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="font-semibold text-lg text-success">{Math.round(state.currentPlan.metrics.confidence_mean * 100)}%</div>
                      <div className="text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setCurrentView('plan')} className="flex-1 hover-scale">
                      Review Plan
                    </Button>
                    <Button onClick={() => setCurrentView('executor')} variant="outline" className="flex-1 hover-scale">
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
    <Layout currentView={currentView} onViewChange={(view) => setCurrentView(view as any)}>
      <div className="p-8">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default Index;
