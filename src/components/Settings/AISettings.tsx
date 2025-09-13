import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Brain, Cpu, Cloud } from "lucide-react";
import { AIProvider } from "@/types/archiver";

const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo'
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
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: 'openai',
      name: 'OpenAI',
      apiKey: '',
      model: 'gpt-4o-mini',
      isConnected: false
    },
    {
      id: 'openrouter',
      name: 'Open Router',
      apiKey: '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',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-4-maverick:free',
      isConnected: false
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      apiKey: '',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2',
      isConnected: false
    }
  ]);

  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const testConnection = async (providerId: string) => {
    setTesting(prev => ({ ...prev, [providerId]: true }));
    
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    try {
      let isValid = false;
      
      if (providerId === 'openai') {
        // Test OpenAI connection
        if (provider.apiKey.trim()) {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          isValid = response.ok;
        }
      } else if (providerId === 'openrouter') {
        // Test Open Router connection
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        isValid = response.ok;
      } else if (providerId === 'ollama') {
        // Test Ollama connection
        try {
          const response = await fetch(`${provider.baseUrl}/api/tags`);
          isValid = response.ok;
        } catch (error) {
          isValid = false;
        }
      }

      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, isConnected: isValid } : p
      ));

      toast({
        title: isValid ? "Connection successful" : "Connection failed",
        description: isValid 
          ? `Successfully connected to ${provider.name}` 
          : `Failed to connect to ${provider.name}. Please check your settings.`,
        variant: isValid ? "default" : "destructive"
      });

    } catch (error) {
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, isConnected: false } : p
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

  const updateProvider = (providerId: string, updates: Partial<AIProvider>) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, ...updates, isConnected: false } : p
    ));
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
        {providers.map((provider) => (
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
                    onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                    placeholder={provider.id === 'openrouter' ? 'Pre-filled with provided key' : 'Enter your API key'}
                    disabled={provider.id === 'openrouter'}
                  />
                </div>
              )}

              {provider.baseUrl && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider.id}-base-url`}>Base URL</Label>
                  <Input
                    id={`${provider.id}-base-url`}
                    value={provider.baseUrl}
                    onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-model`}>Model</Label>
                <Select
                  value={provider.model}
                  onValueChange={(value) => updateProvider(provider.id, { model: value })}
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
                  {provider.id === 'openrouter' && 'Uses pre-configured free tier'}
                  {provider.id === 'ollama' && 'Requires Ollama running locally'}
                </div>
                <Button
                  onClick={() => testConnection(provider.id)}
                  disabled={testing[provider.id] || (provider.id === 'openai' && !provider.apiKey.trim())}
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