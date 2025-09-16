import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Save, X, FileType, FolderTree, Zap } from 'lucide-react';

interface OrganizationRule {
  id: string;
  name: string;
  description: string;
  condition: {
    type: 'extension' | 'name_contains' | 'size' | 'date' | 'content_type';
    value: string;
    operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with';
  };
  action: {
    folderName: string;
    subfolder?: string;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const defaultRules: OrganizationRule[] = [
  {
    id: 'rule-1',
    name: 'Image Files',
    description: 'Organize all image files into Images folder',
    condition: { type: 'extension', value: 'jpg,jpeg,png,gif,webp,svg', operator: 'equals' },
    action: { folderName: 'Images' },
    priority: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule-2',
    name: 'Document Files',
    description: 'Organize documents into Documents folder',
    condition: { type: 'extension', value: 'pdf,doc,docx,txt,md', operator: 'equals' },
    action: { folderName: 'Documents' },
    priority: 2,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule-3',
    name: 'Large Files',
    description: 'Files larger than 50MB go to Large Files folder',
    condition: { type: 'size', value: '50', operator: 'greater_than' },
    action: { folderName: 'Large Files' },
    priority: 3,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export default function CustomRules() {
  const [rules, setRules] = useState<OrganizationRule[]>([]);
  const [editingRule, setEditingRule] = useState<OrganizationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load rules from localStorage
  useEffect(() => {
    const savedRules = localStorage.getItem('organization-rules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    } else {
      setRules(defaultRules);
      localStorage.setItem('organization-rules', JSON.stringify(defaultRules));
    }
  }, []);

  // Save rules to localStorage
  const saveRules = (newRules: OrganizationRule[]) => {
    setRules(newRules);
    localStorage.setItem('organization-rules', JSON.stringify(newRules));
  };

  const createRule = () => {
    const newRule: OrganizationRule = {
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      condition: { type: 'extension', value: '', operator: 'equals' },
      action: { folderName: '' },
      priority: rules.length + 1,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setEditingRule(newRule);
    setIsCreating(true);
  };

  const saveRule = () => {
    if (!editingRule?.name || !editingRule?.action.folderName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isCreating) {
      saveRules([...rules, editingRule]);
      toast.success('Rule created successfully');
    } else {
      saveRules(rules.map(r => r.id === editingRule.id ? editingRule : r));
      toast.success('Rule updated successfully');
    }

    setEditingRule(null);
    setIsCreating(false);
  };

  const deleteRule = (ruleId: string) => {
    saveRules(rules.filter(r => r.id !== ruleId));
    toast.success('Rule deleted successfully');
  };

  const toggleRule = (ruleId: string) => {
    saveRules(rules.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setIsCreating(false);
  };

  const getConditionLabel = (condition: OrganizationRule['condition']) => {
    const { type, operator, value } = condition;
    const operatorText = {
      equals: 'equals',
      contains: 'contains',
      greater_than: 'greater than',
      less_than: 'less than',
      starts_with: 'starts with',
      ends_with: 'ends with'
    }[operator || 'equals'];

    const typeText = {
      extension: 'File extension',
      name_contains: 'File name',
      size: 'File size (MB)',
      date: 'Date created',
      content_type: 'Content type'
    }[type];

    return `${typeText} ${operatorText} "${value}"`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Custom Organization Rules</h2>
          <p className="text-muted-foreground">Define custom rules to automatically organize your files</p>
        </div>
        <Button onClick={createRule} className="hover-scale">
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Rule Editor */}
      {editingRule && (
        <Card className="border-primary/50 shadow-lg animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              {isCreating ? 'Create New Rule' : 'Edit Rule'}
            </CardTitle>
            <CardDescription>
              Define conditions and actions for automatic file organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name *</Label>
                <Input
                  id="rule-name"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="e.g., Image Files"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-name">Target Folder *</Label>
                <Input
                  id="folder-name"
                  value={editingRule.action.folderName}
                  onChange={(e) => setEditingRule({ 
                    ...editingRule, 
                    action: { ...editingRule.action, folderName: e.target.value }
                  })}
                  placeholder="e.g., Images"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingRule.description}
                onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                placeholder="Describe what this rule does..."
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Condition Type</Label>
                <Select
                  value={editingRule.condition.type}
                  onValueChange={(value: OrganizationRule['condition']['type']) =>
                    setEditingRule({
                      ...editingRule,
                      condition: { ...editingRule.condition, type: value, value: '' }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="extension">File Extension</SelectItem>
                    <SelectItem value="name_contains">File Name</SelectItem>
                    <SelectItem value="size">File Size (MB)</SelectItem>
                    <SelectItem value="content_type">Content Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={editingRule.condition.operator || 'equals'}
                  onValueChange={(value: OrganizationRule['condition']['operator']) =>
                    setEditingRule({
                      ...editingRule,
                      condition: { ...editingRule.condition, operator: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="starts_with">Starts With</SelectItem>
                    <SelectItem value="ends_with">Ends With</SelectItem>
                    {editingRule.condition.type === 'size' && (
                      <>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  value={editingRule.condition.value}
                  onChange={(e) => setEditingRule({
                    ...editingRule,
                    condition: { ...editingRule.condition, value: e.target.value }
                  })}
                  placeholder={
                    editingRule.condition.type === 'extension' ? 'jpg,png,gif' :
                    editingRule.condition.type === 'size' ? '50' :
                    editingRule.condition.type === 'name_contains' ? 'document' :
                    'value'
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={cancelEdit} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={saveRule}>
                <Save className="h-4 w-4 mr-2" />
                Save Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <div className="grid gap-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderTree className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Rules Defined</h3>
              <p className="text-muted-foreground mb-4">
                Create your first organization rule to automate file sorting
              </p>
              <Button onClick={createRule}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card 
              key={rule.id} 
              className={`hover:shadow-md transition-all hover-scale ${
                !rule.isActive ? 'opacity-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{rule.name}</h3>
                      <Badge 
                        variant={rule.isActive ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Priority: {rule.priority}
                      </Badge>
                    </div>
                    
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs">
                      <FileType className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {getConditionLabel(rule.condition)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{rule.action.folderName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => toggleRule(rule.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {rule.isActive ? (
                        <span className="text-xs text-success">ON</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">OFF</span>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setEditingRule(rule);
                        setIsCreating(false);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{rule.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRule(rule.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}