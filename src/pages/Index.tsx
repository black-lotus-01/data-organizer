import { useState } from "react";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { ArchivePlanView } from "@/components/ArchivePlanView";
import { AISettings } from "@/components/Settings/AISettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FolderOpen, Sparkles, FileSearch, Settings } from "lucide-react";
import { FileMetadata, ArchivePlan } from "@/types/archiver";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'plan' | 'settings'>('home');
  const [analyzedFiles, setAnalyzedFiles] = useState<FileMetadata[]>([]);
  const [archivePlan, setArchivePlan] = useState<ArchivePlan | null>(null);

  const handleFilesAnalyzed = async (files: FileMetadata[]) => {
    setAnalyzedFiles(files);
    
    // Generate mock archive plan for demo
    const mockPlan: ArchivePlan = {
      root_path: "/uploaded-files",
      summary: {
        total_files: files.length,
        total_size: files.reduce((acc, f) => acc + f.size, 0),
        detected_topics: ["Documents", "Images", "Code", "Archives"],
        sensitive_count: 0,
        recommended_folders: 4
      },
      folders: [
        {
          name: "documents-2024",
          display_name: "Documents 2024",
          rationale: "Text documents and PDFs grouped by creation year",
          confidence: 0.92,
          files: files.filter(f => f.mime.includes('text') || f.mime.includes('pdf')).map(f => ({
            path: f.path,
            action: 'move' as const,
            reason: "Document type detected",
            confidence: 0.89
          }))
        },
        {
          name: "media-files",
          display_name: "Media Files",
          rationale: "Images, videos, and audio files organized by type",
          confidence: 0.87,
          files: files.filter(f => f.mime.startsWith('image') || f.mime.startsWith('video') || f.mime.startsWith('audio')).map(f => ({
            path: f.path,
            action: 'move' as const,
            reason: "Media type detected",
            confidence: 0.85
          }))
        }
      ],
      operations: [
        {
          op: 'create_folder',
          target: 'documents-2024',
          items: [],
          estimated_effect: { size_change: 0 }
        },
        {
          op: 'create_folder',
          target: 'media-files',
          items: [],
          estimated_effect: { size_change: 0 }
        }
      ],
      dedupe: {
        duplicates: [],
        strategy_used: 'link'
      },
      sensitive: [],
      rollback: {
        instructions: ["Restore from backup", "Revert folder structure"],
        timestamped_log_reference: "archive-" + Date.now()
      },
      metrics: {
        confidence_mean: 0.89,
        folders_created: 2,
        files_moved: files.length
      },
      errors: [],
      config_used: {
        auto_confirm: false,
        confidence_threshold: 0.45
      }
    };

    setArchivePlan(mockPlan);
    setCurrentView('plan');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return <FileUpload onFilesAnalyzed={handleFilesAnalyzed} />;
      case 'plan':
        return archivePlan ? (
          <ArchivePlanView
            plan={archivePlan}
            onExecute={() => {
              // Handle plan execution
              setCurrentView('home');
            }}
            onCancel={() => setCurrentView('home')}
          />
        ) : null;
      case 'settings':
        return <AISettings />;
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
                    Analyze Files
                  </CardTitle>
                  <CardDescription>
                    Upload and analyze files for intelligent organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Analysis</Button>
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
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <Button variant="outline" className="w-full">Configure</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest archiving operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground text-sm">
                    No recent activity
                  </div>
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
