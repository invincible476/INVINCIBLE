import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  content: string;
  senderId: number;
  createdAt: string;
  messageType: string;
  sender?: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string;
  };
}

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: loading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId && !!user,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });

  const { data: conversation } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'details'],
    enabled: !!conversationId && !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      // Refresh both messages and conversations
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    await sendMessageMutation.mutateAsync(content);
  };

  const getConversationName = () => {
    if (!conversation) return 'Chat';
    if (conversation.name) return conversation.name;
    
    if (conversation.isGroup) {
      return conversation.participants
        ?.map((p: any) => p.fullName || p.username)
        .join(', ') || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants?.find((p: any) => p.userId !== user?.id);
    return otherParticipant?.fullName || otherParticipant?.username || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (!conversation) return null;
    if (conversation.avatarUrl) return conversation.avatarUrl;
    
    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants?.find((p: any) => p.userId !== user?.id);
      return otherParticipant?.avatarUrl;
    }
    
    return null;
  };

  const getParticipantsText = () => {
    if (!conversation) return 'Loading...';
    
    if (conversation.isGroup) {
      return `${conversation.participants?.length || 0} participants`;
    }
    
    return 'Active now';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
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
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-border p-4 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getConversationAvatar()} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(getConversationName())}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{getConversationName()}</h3>
            <p className="text-sm text-muted-foreground">{getParticipantsText()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message: Message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showAvatar={showAvatar}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
};