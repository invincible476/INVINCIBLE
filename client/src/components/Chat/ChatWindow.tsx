import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { UserProfileDialog } from './UserProfileDialog';
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
  const [selectedProfile, setSelectedProfile] = useState<{user: any, profile: any} | null>(null);
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

  // Fetch messages with more frequent updates
  const { data: messages = [], isLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      console.log(`Fetching messages for conversation ${conversationId}`);
      const response = await apiRequest(`/api/conversations/${conversationId}/messages`);
      const msgs = response || [];
      console.log(`Loaded ${msgs.length} messages`);
      return msgs;
    },
    enabled: !!conversationId,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time feel
    staleTime: 1000, // Consider data stale after 1 second
  });

  // Send message mutation with better error handling
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!content.trim()) {
        throw new Error('Message cannot be empty');
      }
      
      console.log('Sending message:', { content: content.trim(), conversationId });
      const response = await apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: content.trim(),
          messageType: 'text'
        }),
      });
      return response;
    },
    onSuccess: (newMessage) => {
      console.log('Message sent successfully:', newMessage);
      setMessage('');
      
      // Immediately refetch messages and conversations
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 150);
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      // Show error toast or notification here if needed
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

  const getDisplayName = () => {
    if (conversationDetails?.name) {
      return conversationDetails.name;
    }
    
    if (conversationName && conversationName !== 'Unknown') {
      return conversationName;
    }
    
    // Try to get name from conversation details participants
    if (conversationDetails?.participants) {
      const otherParticipant = conversationDetails.participants.find((p: any) => p.userId !== user?.id);
      if (otherParticipant?.profile) {
        return otherParticipant.profile.fullName || otherParticipant.profile.username;
      }
    }
    
    return 'Unknown User';
  };

  const displayName = getDisplayName();

  const handleHeaderAvatarClick = () => {
    if (conversationDetails?.participants) {
      const otherParticipant = conversationDetails.participants.find((p: any) => p.userId !== user?.id);
      if (otherParticipant?.userId) {
        setSelectedProfile({
          user: { id: otherParticipant.userId, email: '' },
          profile: otherParticipant.profile || {
            id: '',
            username: 'unknown',
            fullName: 'Unknown User',
            createdAt: new Date().toISOString()
          }
        });
      }
    }
  };

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
            <div className="relative">
              <Avatar 
                className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleHeaderAvatarClick}
              >
                {conversationDetails?.participants?.find((p: any) => p.userId !== user?.id)?.profile?.avatarUrl ? (
                  <AvatarImage src={conversationDetails.participants.find((p: any) => p.userId !== user?.id)?.profile?.avatarUrl} />
                ) : (
                  <AvatarFallback className="text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm">{displayName}</CardTitle>
              <div className="flex items-center gap-2">
                {conversationDetails?.participants && (
                  <p className="text-xs text-muted-foreground">
                    {conversationDetails.participants.length} member{conversationDetails.participants.length !== 1 ? 's' : ''}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Online</span>
                </div>
              </div>
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

      {/* Profile Dialog */}
      {selectedProfile && (
        <UserProfileDialog
          userId={selectedProfile.user.id.toString()}
          open={!!selectedProfile}
          onOpenChange={(open) => !open && setSelectedProfile(null)}
        />
      )}
    </div>
  );
};