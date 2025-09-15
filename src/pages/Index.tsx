import { useState } from "react";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { ArchivePlanView } from "@/components/ArchivePlanView";
import { AISettings } from "@/components/Settings/AISettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FolderOpen, Sparkles, FileSearch, Settings, History } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { formatActivityTime, getActivityIcon } from "@/services/activityManager";

const Index = () => {
  const { state, setCurrentPlan } = useApp();
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'plan' | 'settings' | 'activity'>('home');

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return <FileUpload />;
      case 'plan':
        return state.currentPlan ? (
          <ArchivePlanView
            plan={state.currentPlan}
            onExecute={() => setCurrentView('home')}
            onCancel={() => setCurrentView('home')}
          />
        ) : null;
      case 'settings':
        return <AISettings />;
      case 'activity':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
              <p className="text-muted-foreground">
                Track all your archiving operations and AI connections
              </p>
            </div>
            <div className="space-y-4">
              {state.activityHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No recent activity
                  </CardContent>
                </Card>
              ) : (
                state.activityHistory.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{activity.title}</h4>
                            <span className="text-sm text-muted-foreground">
                              {formatActivityTime(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
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

            <div className="grid md:grid-cols-3 gap-6">
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
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest archiving operations
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
