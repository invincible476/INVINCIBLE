import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CreateConversationDialog } from './CreateConversationDialog';

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatarUrl: string | null;
  updatedAt: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  participants?: {
    id: string;
    userId: number;
    fullName: string;
    username: string;
    avatarUrl: string;
  }[];
}

interface ConversationsListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationsList = ({
  selectedConversationId,
  onSelectConversation,
}: ConversationsListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: conversations = [], isLoading: loading, error } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;

    if (conversation.isGroup) {
      const names = conversation.participants
        ?.filter(p => p.userId !== user?.id)
        ?.map((p) => p.user?.profile?.fullName || p.user?.profile?.username || 'Unknown User')
        .join(', ');
      return names || 'Group Chat';
    }

    const otherParticipant = conversation.participants?.find(p => p.userId !== user?.id);
    if (otherParticipant?.user?.profile) {
      return otherParticipant.user.profile.fullName || 
             otherParticipant.user.profile.username || 
             'Unknown User';
    }
    return 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants?.find(p => p.userId !== user?.id);
      return otherParticipant?.user?.profile?.avatarUrl || null;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter((conversation) =>
    getConversationName(conversation).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Chat button */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-chat-sidebar-foreground">Conversations</h2>
          <CreateConversationDialog onConversationCreated={onSelectConversation} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-chat-sidebar-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm opacity-75">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={cn(
                  "w-full h-auto p-3 justify-start text-left hover:bg-chat-sidebar-hover",
                  selectedConversationId === conversation.id && "bg-chat-sidebar-hover"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getConversationAvatar(conversation) || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(getConversationName(conversation))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-chat-sidebar-foreground truncate">
                        {getConversationName(conversation)}
                      </p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conversation.lastMessage.createdAt), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};