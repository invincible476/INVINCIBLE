import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  updated_at: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  participants?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      // Get conversations with participants and last message
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          name,
          is_group,
          avatar_url,
          updated_at,
          conversation_participants!inner (
            user_id,
            profiles (
              id,
              full_name,
              username,
              avatar_url
            )
          )
        `)
        .eq('conversation_participants.user_id', user?.id);

      if (conversationsError) throw conversationsError;

      // Get last message for each conversation
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conversation,
            last_message: lastMessage,
            participants: conversation.conversation_participants.map((p: any) => p.profiles),
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.is_group) {
      return conversation.participants
        ?.map((p) => p.full_name || p.username)
        .join(', ') || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants?.find((p) => p.id !== user?.id);
    return otherParticipant?.full_name || otherParticipant?.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar_url) return conversation.avatar_url;
    
    if (!conversation.is_group) {
      const otherParticipant = conversation.participants?.find((p) => p.id !== user?.id);
      return otherParticipant?.avatar_url;
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
      {/* Search */}
      <div className="p-4 border-b border-border">
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
                      {conversation.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conversation.last_message.created_at), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message.content}
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