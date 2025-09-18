import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Download, Trash2, RotateCcw, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { quarantineService, QuarantinedFile } from '@/services/quarantineService';
import { virusTotalService } from '@/services/virusTotalService';

export const SecurityDashboard: React.FC = () => {
  const [quarantinedFiles, setQuarantinedFiles] = useState<QuarantinedFile[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [selectedFile, setSelectedFile] = useState<QuarantinedFile | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    refreshQuarantinedFiles();
    const existingApiKey = virusTotalService.getApiKey();
    if (existingApiKey) {
      setApiKey(existingApiKey);
    }
  }, []);

  const refreshQuarantinedFiles = () => {
    setQuarantinedFiles(quarantineService.getQuarantinedFiles());
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    setIsTestingApiKey(true);
    try {
      const isValid = await virusTotalService.testApiKey(apiKey.trim());
      if (isValid) {
        virusTotalService.setApiKey(apiKey.trim());
        toast({
          title: "Success",
          description: "VirusTotal API key saved successfully",
        });
        setIsSettingsOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Invalid API key format. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    try {
      await quarantineService.restoreFile(fileId, actionNotes);
      toast({
        title: "Success",
        description: "File restored successfully",
      });
      refreshQuarantinedFiles();
      setSelectedFile(null);
      setActionNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore file",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await quarantineService.deleteQuarantinedFile(fileId, actionNotes);
      toast({
        title: "Success",
        description: "File deleted permanently",
      });
      refreshQuarantinedFiles();
      setSelectedFile(null);
      setActionNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      await quarantineService.downloadQuarantinedFile(fileId);
      toast({
        title: "Success",
        description: "File download started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const getThreatBadgeVariant = (level: string) => {
    switch (level) {
      case 'clean': return 'secondary';
      case 'suspicious': return 'outline';
      case 'malicious': return 'destructive';
      default: return 'secondary';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'clean': return <CheckCircle className="h-4 w-4" />;
      case 'suspicious': return <AlertTriangle className="h-4 w-4" />;
      case 'malicious': return <Shield className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const stats = quarantineService.getQuarantineStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-muted-foreground">Monitor threats and manage quarantined files</p>
        </div>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Security Settings</DialogTitle>
              <DialogDescription>
                Configure VirusTotal API for malware scanning
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">VirusTotal API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your VirusTotal API key"
                />
                <p className="text-sm text-muted-foreground">
                  Get your free API key from{' '}
                  <a href="https://www.virustotal.com/gui/join-us" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    VirusTotal
                  </a>
                </p>
              </div>
              <Button onClick={handleSaveApiKey} disabled={isTestingApiKey}>
                {isTestingApiKey ? 'Testing...' : 'Save & Test API Key'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quarantined</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Malicious Files</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.malicious}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Restored</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.restored}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quarantined Files */}
      <Card>
        <CardHeader>
          <CardTitle>Quarantined Files</CardTitle>
          <CardDescription>
            Manage files that have been flagged as potentially dangerous
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quarantinedFiles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No quarantined files</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quarantinedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getThreatIcon(file.threatAnalysis.threatLevel)}
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        Quarantined: {new Date(file.quarantineDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getThreatBadgeVariant(file.threatAnalysis.threatLevel)}>
                          {file.threatAnalysis.threatLevel}
                        </Badge>
                        {file.threatAnalysis.detectionCount > 0 && (
                          <Badge variant="outline">
                            {file.threatAnalysis.detectionCount}/{file.threatAnalysis.totalEngines} detections
                          </Badge>
                        )}
                        <Badge variant="outline">{file.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'quarantined' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(file.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFile(file)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Restore File</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to restore "{file.fileName}"?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>
                                  {file.threatAnalysis.recommendation}
                                </AlertDescription>
                              </Alert>
                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                  id="notes"
                                  value={actionNotes}
                                  onChange={(e) => setActionNotes(e.target.value)}
                                  placeholder="Add a note about why you're restoring this file..."
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFile(null);
                                    setActionNotes('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleRestoreFile(file.id)}
                                >
                                  Restore File
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSelectedFile(file)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete File Permanently</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. The file will be permanently deleted.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="delete-notes">Notes (optional)</Label>
                                <Textarea
                                  id="delete-notes"
                                  value={actionNotes}
                                  onChange={(e) => setActionNotes(e.target.value)}
                                  placeholder="Add a note about why you're deleting this file..."
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFile(null);
                                    setActionNotes('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteFile(file.id)}
                                >
                                  Delete Permanently
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};