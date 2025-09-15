import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Play, Pause, Square, RotateCcw, CheckCircle, AlertTriangle, Clock, FolderPlus, MoveRight, Copy } from 'lucide-react';
import { ArchivePlan, Operation, OperationStatus, ActivityType } from '@/types/archiver';
import { fileOrganizer } from '@/services/fileOrganizer';
import { addActivity, createPlanExecutedActivity, createFolderCreatedActivity, createFileMovedActivity } from '@/services/activityManager';

interface ExecutionStep {
  id: string;
  operation: Operation;
  status: OperationStatus;
  progress: number;
  error?: string;
}

interface PlanExecutorProps {
  plan: ArchivePlan;
  onComplete: () => void;
  onCancel: () => void;
}

export default function PlanExecutor({ plan, onComplete, onCancel }: PlanExecutorProps) {
  const { addActivityRecord, setPlanExecuting } = useApp();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize execution steps from plan operations
    const initialSteps: ExecutionStep[] = plan.operations.map((operation, index) => ({
      id: `step-${index}`,
      operation,
      status: OperationStatus.PENDING,
      progress: 0
    }));
    setSteps(initialSteps);
  }, [plan]);

  const getOperationIcon = (op: string) => {
    switch (op) {
      case 'create_folder':
        return <FolderPlus className="h-4 w-4" />;
      case 'move':
        return <MoveRight className="h-4 w-4" />;
      case 'copy':
        return <Copy className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OperationStatus) => {
    switch (status) {
      case OperationStatus.COMPLETED:
        return 'text-green-500';
      case OperationStatus.FAILED:
        return 'text-red-500';
      case OperationStatus.IN_PROGRESS:
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const executeStep = async (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex];
    if (!step) return false;

    setSteps(prev => prev.map((s, i) => 
      i === stepIndex 
        ? { ...s, status: OperationStatus.IN_PROGRESS, progress: 0 }
        : s
    ));

    try {
      const { operation } = step;
      
      // Simulate operation execution with progress updates
      for (let progress = 0; progress <= 100; progress += 20) {
        if (isPaused) {
          await new Promise(resolve => {
            const checkPause = () => {
              if (!isPaused) resolve(undefined);
              else setTimeout(checkPause, 100);
            };
            checkPause();
          });
        }

        setSteps(prev => prev.map((s, i) => 
          i === stepIndex 
            ? { ...s, progress }
            : s
        ));

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Mark step as completed
      setSteps(prev => prev.map((s, i) => 
        i === stepIndex 
          ? { ...s, status: OperationStatus.COMPLETED, progress: 100 }
          : s
      ));

      // Log activity based on operation type
      if (operation.op === 'create_folder') {
        addActivityRecord(createFolderCreatedActivity(operation.target));
      } else if (operation.op === 'move') {
        addActivityRecord(createFileMovedActivity(operation.items[0], operation.target));
      }

      return true;
    } catch (error) {
      setSteps(prev => prev.map((s, i) => 
        i === stepIndex 
          ? { 
              ...s, 
              status: OperationStatus.FAILED, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : s
      ));
      return false;
    }
  };

  const startExecution = async () => {
    if (!fileOrganizer.isLocationSelected()) {
      toast.error('Please select an organization location first');
      return;
    }

    setIsExecuting(true);
    setPlanExecuting(true);
    setStartTime(new Date());
    
    addActivityRecord(addActivity({
      type: ActivityType.PLAN_EXECUTED,
      status: OperationStatus.IN_PROGRESS,
      title: 'Plan Execution Started',
      description: `Executing archive plan with ${plan.operations.length} operations`,
      metadata: {
        planId: plan.root_path,
        folderCount: plan.metrics.folders_created,
        fileCount: plan.metrics.files_moved
      }
    }));

    let successCount = 0;
    
    for (let i = 0; i < steps.length; i++) {
      if (!isExecuting) break;
      
      setCurrentStep(i);
      const success = await executeStep(i);
      
      if (success) {
        successCount++;
      } else {
        toast.error(`Failed to execute step ${i + 1}`);
      }
      
      setOverallProgress(((i + 1) / steps.length) * 100);
    }

    setIsExecuting(false);
    setPlanExecuting(false);
    setEndTime(new Date());
    
    const finalStatus = successCount === steps.length ? OperationStatus.COMPLETED : OperationStatus.FAILED;
    
    addActivityRecord(addActivity({
      type: ActivityType.PLAN_EXECUTED,
      status: finalStatus,
      title: 'Plan Execution Completed',
      description: `Executed ${successCount}/${steps.length} operations successfully`,
      metadata: {
        planId: plan.root_path,
        folderCount: plan.metrics.folders_created,
        fileCount: successCount
      }
    }));

    if (finalStatus === OperationStatus.COMPLETED) {
      toast.success('Plan executed successfully!');
      onComplete();
    } else {
      toast.error('Plan execution completed with errors');
    }
  };

  const pauseExecution = () => {
    setIsPaused(true);
    toast.info('Execution paused');
  };

  const resumeExecution = () => {
    setIsPaused(false);
    toast.info('Execution resumed');
  };

  const stopExecution = () => {
    setIsExecuting(false);
    setIsPaused(false);
    setPlanExecuting(false);
    
    setSteps(prev => prev.map(step => 
      step.status === OperationStatus.IN_PROGRESS || step.status === OperationStatus.PENDING
        ? { ...step, status: OperationStatus.CANCELLED }
        : step
    ));
    
    addActivityRecord(addActivity({
      type: ActivityType.PLAN_CANCELLED,
      status: OperationStatus.CANCELLED,
      title: 'Plan Execution Cancelled',
      description: 'Archive plan execution was cancelled by user',
      metadata: {
        planId: plan.root_path
      }
    }));
    
    toast.warning('Execution cancelled');
    onCancel();
  };

  const formatDuration = (start: Date, end: Date | null): string => {
    const duration = (end || new Date()).getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Plan Execution
          </CardTitle>
          <CardDescription>
            Execute the archive plan to organize your files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{steps.length} operations</Badge>
            </div>
            {startTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {endTime ? 'Completed in' : 'Running for'} {formatDuration(startTime, endTime)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isExecuting ? (
              <Button onClick={startExecution} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Execution
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button onClick={pauseExecution} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeExecution}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Stop Execution</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to stop the plan execution? This will cancel all remaining operations.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Continue</AlertDialogCancel>
                      <AlertDialogAction onClick={stopExecution}>
                        Stop Execution
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Execution Steps</CardTitle>
          <CardDescription>
            Progress of individual operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    index === currentStep && isExecuting
                      ? 'bg-primary/5 border-primary'
                      : 'bg-background'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.status === OperationStatus.COMPLETED ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : step.status === OperationStatus.FAILED ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : step.status === OperationStatus.IN_PROGRESS ? (
                      <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      getOperationIcon(step.operation.op)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {step.operation.op.replace('_', ' ').toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {step.operation.items.length} item{step.operation.items.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.operation.target}
                    </p>
                    {step.operation.note && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.operation.note}
                      </p>
                    )}
                    {step.status === OperationStatus.IN_PROGRESS && (
                      <div className="mt-2">
                        <Progress value={step.progress} className="h-1" />
                      </div>
                    )}
                    {step.error && (
                      <p className="text-xs text-red-500 mt-1">
                        Error: {step.error}
                      </p>
                    )}
                  </div>
                  <div className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                    {step.status}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}