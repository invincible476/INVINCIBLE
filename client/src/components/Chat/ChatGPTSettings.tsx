
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatGPTService } from '@/lib/chatgpt';
import { Bot, Key, Eye, EyeOff } from 'lucide-react';

export const ChatGPTSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedApiKey = localStorage.getItem('chatgpt_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      ChatGPTService.setApiKey(savedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid API key',
        variant: 'destructive',
      });
      return;
    }

    localStorage.setItem('chatgpt_api_key', apiKey.trim());
    ChatGPTService.setApiKey(apiKey.trim());
    
    toast({
      title: 'API Key Saved',
      description: 'ChatGPT integration is now ready to use',
    });
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key first',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    try {
      ChatGPTService.setApiKey(apiKey.trim());
      const response = await ChatGPTService.sendMessage('Hello, please respond with "Connection successful!"');
      
      toast({
        title: 'Connection Successful',
        description: 'ChatGPT is working correctly!',
      });
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemoveApiKey = () => {
    setApiKey('');
    localStorage.removeItem('chatgpt_api_key');
    ChatGPTService.setApiKey('');
    
    toast({
      title: 'API Key Removed',
      description: 'ChatGPT integration has been disabled',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          ChatGPT Integration
        </CardTitle>
        <CardDescription>
          Configure ChatGPT to get AI assistance in your conversations. Get your API key from{' '}
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            OpenAI Platform
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">OpenAI API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveApiKey} className="flex-1">
            <Key className="h-4 w-4 mr-2" />
            Save API Key
          </Button>
          <Button 
            onClick={handleTestConnection} 
            variant="outline"
            disabled={isTesting || !apiKey.trim()}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Testing...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>

        {ChatGPTService.isConfigured() && (
          <Button onClick={handleRemoveApiKey} variant="destructive" className="w-full">
            Remove API Key
          </Button>
        )}

        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-semibold mb-1">How to use:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Start any message with "@ai" to get ChatGPT assistance</li>
            <li>Example: "@ai What's the weather like today?"</li>
            <li>ChatGPT will respond in the same conversation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
