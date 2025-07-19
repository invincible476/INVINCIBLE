import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: number;
  createdAt: string;
  messageType: string;
  senderProfile?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}

interface ChatWindowProps {
  conversationId: string;
  conversationName: string;
  onBack: () => void;
}

export const ChatWindow = ({ conversationId, conversationName, onBack }: ChatWindowProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation details
  const { data: conversationDetails } = useQuery({
    queryKey: ['conversation-details', conversationId],
    queryFn: async () => {
      return apiRequest(`/api/conversations/${conversationId}/details`);
    },
    enabled: !!conversationId,
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await apiRequest(`/api/conversations/${conversationId}/messages`);
      return response || [];
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log('Sending message:', { content, conversationId });
      const response = await apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return response;
    },
    onSuccess: (newMessage) => {
      console.log('Message sent successfully:', newMessage);
      // Invalidate and refetch messages
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
      // Scroll to bottom after a short delay to ensure the message is rendered
      setTimeout(scrollToBottom, 100);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    await sendMessageMutation.mutateAsync(message.trim());
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const displayName = conversationDetails?.name || conversationName || 'Unknown';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">{displayName}</CardTitle>
              {conversationDetails?.participants && (
                <p className="text-xs text-muted-foreground">
                  {conversationDetails.participants.length} member{conversationDetails.participants.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg: Message) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
                senderName={msg.senderProfile?.fullName || msg.senderProfile?.username || 'Unknown User'}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <Card className="rounded-none border-x-0 border-b-0">
        <CardContent className="p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};