import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Trash2, Download, Upload, FolderOpen, Calendar, Files, Target } from 'lucide-react';
import { format } from 'date-fns';

export default function SavedPlans() {
  const { state, deleteSavedPlan, setCurrentPlan } = useApp();
  const { savedPlans } = state;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  const handleLoadPlan = (planId: string) => {
    const plan = savedPlans.find(p => p.id === planId);
    if (plan) {
      setCurrentPlan(plan.plan);
      toast.success(`Loaded plan: ${plan.name}`);
    }
  };

  const handleDeletePlan = (planId: string) => {
    const plan = savedPlans.find(p => p.id === planId);
    deleteSavedPlan(planId);
    toast.success(`Deleted plan: ${plan?.name}`);
  };

  const handleExportPlan = (planId: string) => {
    const plan = savedPlans.find(p => p.id === planId);
    if (plan) {
      const dataStr = JSON.stringify(plan, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${plan.name.replace(/\s+/g, '_')}_plan.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported plan: ${plan.name}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (savedPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Saved Plans</h3>
        <p className="text-muted-foreground">
          Analyze some files and save your first archive plan to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Saved Plans</h2>
          <p className="text-muted-foreground">Manage your saved archive plans</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {savedPlans.length} plan{savedPlans.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {savedPlans.map((savedPlan) => (
          <Card key={savedPlan.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg line-clamp-1">{savedPlan.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(savedPlan.createdAt), 'MMM d, yyyy')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Files className="h-3 w-3 text-muted-foreground" />
                    <span>{savedPlan.plan.summary.total_files} files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span>{savedPlan.plan.summary.recommended_folders} folders</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(savedPlan.plan.summary.total_size)}
                    </span>
                  </div>
                </div>

                {savedPlan.plan.summary.detected_topics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-2 text-muted-foreground">Topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {savedPlan.plan.summary.detected_topics.slice(0, 3).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                          {topic}
                        </Badge>
                      ))}
                      {savedPlan.plan.summary.detected_topics.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          +{savedPlan.plan.summary.detected_topics.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-0 gap-2">
              <Button
                onClick={() => handleLoadPlan(savedPlan.id)}
                size="sm"
                className="flex-1"
              >
                <Upload className="h-3 w-3 mr-1" />
                Load
              </Button>
              <Button
                onClick={() => handleExportPlan(savedPlan.id)}
                variant="outline"
                size="sm"
              >
                <Download className="h-3 w-3" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{savedPlan.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeletePlan(savedPlan.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}