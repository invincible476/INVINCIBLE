import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot } from 'lucide-react';
import { ChatGPTService } from '@/lib/chatgpt';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  conversationId?: string;
}

export const MessageInput = ({ onSendMessage, disabled, conversationId }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    const messageContent = message.trim();
    setMessage('');

    // Check if message starts with @ai for ChatGPT integration
    if (messageContent.toLowerCase().startsWith('@ai ')) {
      if (!ChatGPTService.isConfigured()) {
        toast({
          title: 'ChatGPT Not Configured',
          description: 'Please configure your OpenAI API key in settings to use AI features.',
          variant: 'destructive',
        });
        return;
      }

      setIsProcessingAI(true);

      // Send user message first
      onSendMessage(messageContent);

      try {
        // Extract the actual question (remove @ai prefix)
        const aiQuery = messageContent.substring(4);

        // Get ChatGPT response
        const aiResponse = await ChatGPTService.sendMessage(aiQuery);

        // Send AI response as a new message
        setTimeout(() => {
          onSendMessage(`🤖 ChatGPT: ${aiResponse}`);
        }, 500);

      } catch (error: any) {
        toast({
          title: 'AI Error',
          description: error.message,
          variant: 'destructive',
        });

        // Send error message
        setTimeout(() => {
          onSendMessage(`🤖 ChatGPT: Sorry, I encountered an error. Please try again.`);
        }, 500);
      } finally {
        setIsProcessingAI(false);
      }
    } else {
      // Regular message
      onSendMessage(messageContent);
    }
  };

  const isAIMessage = message.toLowerCase().startsWith('@ai ');

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message... (use @ai for ChatGPT)"
          disabled={disabled || isProcessingAI}
          className={`pr-10 ${isAIMessage ? 'border-blue-500 bg-blue-50' : ''}`}
        />
        {isAIMessage && (
          <Bot className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
        )}
      </div>
      <Button type="submit" disabled={disabled || !message.trim() || isProcessingAI}>
        {isProcessingAI ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};