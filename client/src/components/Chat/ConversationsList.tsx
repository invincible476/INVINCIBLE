import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/utils';

interface ConversationsListProps {
  onSelectConversation: (id: string, name: string) => void;
  selectedConversationId?: string;
}

export const ConversationsList = ({ onSelectConversation, selectedConversationId }: ConversationsListProps) => {
  const { user } = useAuth();

  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiRequest('/api/conversations');
      return response || [];
    },
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Error loading conversations
          </p>
        </CardContent>
      </Card>
    );
  }

  const getConversationName = (conversation: any) => {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.isGroup) {
      return `Group Chat (${conversation.participants?.length || 0} members)`;
    }

    // For 1-on-1 chats, find the other participant
    const otherParticipant = conversation.participants?.find((p: any) => p.userId !== user?.id);
    if (otherParticipant?.profile) {
      return otherParticipant.profile.fullName || otherParticipant.profile.username || 'Unknown User';
    }

    return 'Unknown Conversation';
  };

  const getConversationAvatar = (conversation: any, name: string) => {
    if (conversation.isGroup) {
      return <Users className="h-4 w-4" />;
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversations ({conversations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start by adding contacts in the Discover tab</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation: any) => {
                const name = getConversationName(conversation);
                const isSelected = selectedConversationId === conversation.id;

                return (
                  <Button
                    key={conversation.id}
                    variant={isSelected ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => onSelectConversation(conversation.id, name)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="text-xs">
                          {getConversationAvatar(conversation, name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{name}</p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        {conversation.isGroup && (
                          <Badge variant="outline" size="sm" className="mt-1">
                            Group
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};