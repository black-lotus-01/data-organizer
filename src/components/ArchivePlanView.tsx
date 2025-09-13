import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FolderPlus, 
  Move, 
  Copy, 
  Link, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react';
import { ArchivePlan } from '@/types/archiver';

interface ArchivePlanViewProps {
  plan: ArchivePlan;
  onExecute: () => void;
  onCancel: () => void;
}

export const ArchivePlanView = ({ plan, onExecute, onCancel }: ArchivePlanViewProps) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'move': return <Move className="h-4 w-4" />;
      case 'copy': return <Copy className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getOperationIcon = (op: string) => {
    switch (op) {
      case 'create_folder': return <FolderPlus className="h-4 w-4" />;
      case 'move': return <Move className="h-4 w-4" />;
      case 'copy': return <Copy className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Archive Plan Summary
          </CardTitle>
          <CardDescription>
            AI-generated organization plan for {plan.summary.total_files} files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{plan.summary.total_files}</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.summary.recommended_folders}</p>
              <p className="text-sm text-muted-foreground">New Folders</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{plan.summary.sensitive_count}</p>
              <p className="text-sm text-muted-foreground">Sensitive Files</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(plan.metrics.confidence_mean * 100)}%</p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <p className="text-sm font-medium mb-2">Detected Topics</p>
            <div className="flex flex-wrap gap-2">
              {plan.summary.detected_topics.map((topic, index) => (
                <Badge key={index} variant="secondary">{topic}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensitive Files Warning */}
      {plan.sensitive.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center text-warning">
              <Shield className="h-5 w-5 mr-2" />
              Sensitive Files Detected
            </CardTitle>
            <CardDescription>
              These files require special handling for security reasons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.sensitive.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <div>
                    <p className="font-medium">{file.path}</p>
                    <p className="text-sm text-muted-foreground">{file.type}</p>
                  </div>
                  <Badge variant="outline" className="text-warning border-warning">
                    {file.advice}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Folder Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderPlus className="h-5 w-5 mr-2" />
            Proposed Folder Structure
          </CardTitle>
          <CardDescription>
            Smart categorization based on content analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plan.folders.map((folder, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{folder.display_name || folder.name}</h4>
                    <p className="text-sm text-muted-foreground">{folder.rationale}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{folder.files.length} files</Badge>
                    <div className="flex items-center">
                      <Progress value={folder.confidence * 100} className="w-16 h-2" />
                      <span className="text-xs ml-2">{Math.round(folder.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {folder.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(file.action)}
                        <span className="truncate">{file.path}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {file.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(file.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operations Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Planned Operations
          </CardTitle>
          <CardDescription>
            Step-by-step execution plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {plan.operations.map((operation, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                <div className="flex-shrink-0">
                  {getOperationIcon(operation.op)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {operation.op.replace('_', ' ').toUpperCase()}: {operation.target}
                  </p>
                  {operation.note && (
                    <p className="text-xs text-muted-foreground">{operation.note}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {operation.items.length} items
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel Plan
        </Button>
        <div className="flex space-x-3">
          <Button variant="secondary">
            Save Plan
          </Button>
          <Button onClick={onExecute} className="bg-primary hover:bg-primary-hover">
            Execute Archive Plan
          </Button>
        </div>
      </div>
    </div>
  );
};