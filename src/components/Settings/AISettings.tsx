import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Brain, Cpu, Cloud } from "lucide-react";
import { AIProvider, OperationStatus } from "@/types/archiver";
import { useApp } from "@/contexts/AppContext";
import { aiService } from "@/services/aiService";
import { createAIConnectionActivity, createAIDisconnectionActivity } from "@/services/activityManager";

const OPENAI_MODELS = [
  'gpt-5-2025-08-07',
  'gpt-5-mini-2025-08-07',
  'gpt-5-nano-2025-08-07',
  'gpt-4.1-2025-04-14',
  'o3-2025-04-16',
  'o4-mini-2025-04-16',
  'gpt-4o-mini',
  'gpt-4o'
];

const OLLAMA_MODELS = [
  'llama3.2',
  'llama3.1',
  'mistral',
  'codellama',
  'qwen2.5'
];

export const AISettings = () => {
  const { toast } = useToast();
  const { state, updateProvider, setCurrentProvider, addActivityRecord } = useApp();
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const testConnection = async (providerId: string) => {
    setTesting(prev => ({ ...prev, [providerId]: true }));
    
    const provider = state.providers.find(p => p.id === providerId);
    if (!provider) return;

    try {
      const isValid = await aiService.testConnection(provider);
      
      updateProvider(providerId, { isConnected: isValid });
      
      // Log activity
      addActivityRecord(createAIConnectionActivity(
        provider.name, 
        isValid ? OperationStatus.COMPLETED : OperationStatus.FAILED,
        isValid ? undefined : 'Connection test failed'
      ));

      // Set as current provider if connected successfully
      if (isValid && !state.currentProvider) {
        setCurrentProvider({ ...provider, isConnected: true });
      }

      toast({
        title: isValid ? "Connection successful" : "Connection failed",
        description: isValid 
          ? `Successfully connected to ${provider.name}` 
          : `Failed to connect to ${provider.name}. Please check your settings.`,
        variant: isValid ? "default" : "destructive"
      });

    } catch (error) {
      updateProvider(providerId, { isConnected: false });
      
      addActivityRecord(createAIConnectionActivity(
        provider.name, 
        OperationStatus.FAILED, 
        error instanceof Error ? error.message : 'Unknown error'
      ));
      
      toast({
        title: "Connection failed",
        description: `Error connecting to ${provider.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const handleProviderUpdate = (providerId: string, updates: Partial<AIProvider>) => {
    updateProvider(providerId, { ...updates, isConnected: false });
    
    // If this was the current provider, disconnect it
    if (state.currentProvider?.id === providerId) {
      setCurrentProvider(null);
      addActivityRecord(createAIDisconnectionActivity(state.currentProvider.name));
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'openai': return <Cloud className="h-5 w-5" />;
      case 'openrouter': return <Brain className="h-5 w-5" />;
      case 'ollama': return <Cpu className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Provider Settings</h2>
        <p className="text-muted-foreground">
          Configure your AI providers for intelligent file archiving and analysis.
        </p>
      </div>

      <div className="grid gap-6">
        {state.providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getProviderIcon(provider.id)}
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>
                      {provider.id === 'openai' && 'OpenAI\'s GPT models for advanced text analysis'}
                      {provider.id === 'openrouter' && 'Access to open-source models via Open Router'}
                      {provider.id === 'ollama' && 'Local AI models running on your machine'}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={provider.isConnected ? "default" : "secondary"}>
                  {provider.isConnected ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Connected</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Disconnected</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider.id !== 'ollama' && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-api-key`}>API Key</Label>
                  <Input
                    id={`${provider.id}-api-key`}
                    type="password"
                    value={provider.apiKey}
                    onChange={(e) => handleProviderUpdate(provider.id, { apiKey: e.target.value })}
                    placeholder="Enter your API key"
                  />
                </div>
              )}

              {provider.baseUrl && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-base-url`}>Base URL</Label>
                  <Input
                    id={`${provider.id}-base-url`}
                    value={provider.baseUrl || ''}
                    onChange={(e) => handleProviderUpdate(provider.id, { baseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-model`}>Model</Label>
                <Select
                  value={provider.model || ''}
                  onValueChange={(value) => handleProviderUpdate(provider.id, { model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {provider.id === 'openai' && OPENAI_MODELS.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                    {provider.id === 'openrouter' && (
                      <SelectItem value="meta-llama/llama-4-maverick:free">
                        meta-llama/llama-4-maverick:free
                      </SelectItem>
                    )}
                    {provider.id === 'ollama' && OLLAMA_MODELS.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {provider.id === 'openai' && 'Requires valid OpenAI API key'}
                  {provider.id === 'openrouter' && 'Requires valid OpenRouter API key'}
                  {provider.id === 'ollama' && 'Requires Ollama running locally'}
                </div>
                <Button
                  onClick={() => testConnection(provider.id)}
                  disabled={testing[provider.id] || (provider.id !== 'ollama' && !provider.apiKey.trim())}
                  variant="outline"
                  size="sm"
                >
                  {testing[provider.id] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};