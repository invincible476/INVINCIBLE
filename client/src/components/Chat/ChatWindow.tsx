
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';

interface User {
  id: number;
  email: string;
  profile?: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}

interface Message {
  id: string;
  content: string;
  senderId: number;
  createdAt: string;
  messageType: string;
  sender?: {
    id: number;
    profile: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
    };
  };
}

interface Participant {
  id: string;
  userId: number;
  user: User;
}

interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
}

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId && !!user,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 500,
  });

  const { data: conversation, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'details'],
    enabled: !!conversationId && !!user,
    staleTime: 30000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!content.trim()) {
        throw new Error('Message cannot be empty');
      }

      console.log('Sending message:', { content: content.trim(), conversationId });

      return apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: {
          content: content.trim(),
          messageType: 'text' 
        },
      });
    },
    onSuccess: (newMessage) => {
      console.log('Message sent successfully:', newMessage);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again',
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
    if (!conversation) return 'Loading...';
    if (conversation.name) return conversation.name;

    if (conversation.isGroup) {
      return conversation.participants
        ?.map((p: Participant) => p.user?.profile?.fullName || p.user?.profile?.username || 'Unknown User')
        .join(', ') || 'Group Chat';
    }

    const otherParticipant = conversation.participants?.find((p: Participant) => p.userId !== user?.id);
    if (otherParticipant?.user?.profile) {
      return otherParticipant.user.profile.fullName || otherParticipant.user.profile.username || 'Unknown User';
    }
    return 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (!conversation) return null;
    if (conversation.name && conversation.isGroup) return null;

    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants?.find((p: Participant) => p.userId !== user?.id);
      return otherParticipant?.user?.profile?.avatarUrl || null;
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
    if (!name || name === 'Unknown User') return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (messagesLoading || conversationLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messagesError || conversationError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load conversation</p>
          <Button onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
            queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'details'] });
          }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const conversationName = getConversationName();

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-border p-4 flex items-center justify-between bg-background">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getConversationAvatar()} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(conversationName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{conversationName}</h3>
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
      <ScrollArea className="flex-1 p-4 bg-gray-50">
        <div className="space-y-1">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-gray-600 text-lg">No messages yet</p>
                <p className="text-gray-400 text-sm mt-2">Start the conversation by sending a message!</p>
              </div>
            </div>
          ) : (
            messages.map((message: Message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

              return (
                <MessageBubble
                  key={`${message.id}-${message.createdAt}`}
                  message={message}
                  isOwnMessage={isOwnMessage}
                  showAvatar={showAvatar}
                />
              );
            })
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage} 
        disabled={sendMessageMutation.isPending}
        conversationId={conversationId}
      />
    </div>
  );
};
