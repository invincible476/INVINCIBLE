import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/utils';
import { UserProfileDialog } from './UserProfileDialog';

interface ConversationsListProps {
  onSelectConversation: (id: string, name: string) => void;
  selectedConversationId?: string;
}

export const ConversationsList = ({ onSelectConversation, selectedConversationId }: ConversationsListProps) => {
  const { user } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiRequest('/api/conversations');
      // Sort conversations by last message time (newest first)
      const sorted = (response || []).sort((a: any, b: any) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt || 0;
        const bTime = b.lastMessage?.createdAt || b.createdAt || 0;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      return sorted;
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
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

  const getConversationAvatar = (conversation: any) => {
    if (conversation.isGroup) {
      return <Users className="h-4 w-4" />;
    }

    const otherParticipant = conversation.participants?.find((p: any) => p.userId !== user?.id);

    if (otherParticipant?.profile?.avatarUrl) {
        return <AvatarImage src={otherParticipant.profile.avatarUrl} alt={otherParticipant?.profile.fullName || otherParticipant?.profile.username || 'Avatar'} />;
    }
    
    const name = getConversationName(conversation);
    return name.charAt(0).toUpperCase();
  };

  const openProfileDialog = (userId: string) => {
    setSelectedProfileId(userId);
    setIsProfileDialogOpen(true);
  };

  const closeProfileDialog = () => {
    setIsProfileDialogOpen(false);
    setSelectedProfileId(null);
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
                const otherParticipant = conversation.participants?.find((p: any) => p.userId !== user?.id);

                const hasNewMessage = conversation.lastMessage && conversation.lastMessage.senderId !== user?.id;
                const lastMessageTime = conversation.lastMessage?.createdAt;
                const timeDisplay = lastMessageTime ? 
                  new Date(lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <Button
                    key={conversation.id}
                    variant={isSelected ? "secondary" : "ghost"}
                    className={`w-full justify-start h-auto p-3 text-left relative ${hasNewMessage ? 'bg-primary/5' : ''}`}
                    onClick={() => onSelectConversation(conversation.id, name)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Avatar 
                        className="h-8 w-8 mt-1 relative cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(otherParticipant?.userId) {
                            openProfileDialog(otherParticipant.userId.toString());
                          }
                        }}
                      >
                        {typeof getConversationAvatar(conversation) === 'string' ? (
                          <AvatarFallback className="text-xs">
                            {getConversationAvatar(conversation)}
                          </AvatarFallback>
                        ) : (
                          getConversationAvatar(conversation)
                        )}
                        {hasNewMessage && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`font-medium text-sm truncate ${hasNewMessage ? 'text-primary' : ''}`}>
                            {name}
                          </p>
                          {timeDisplay && (
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {timeDisplay}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className={`text-xs truncate ${hasNewMessage ? 'text-primary/80 font-medium' : 'text-muted-foreground'}`}>
                            {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {conversation.isGroup && (
                            <Badge variant="outline" size="sm">
                              Group
                            </Badge>
                          )}
                          {hasNewMessage && (
                            <Badge variant="default" size="sm" className="bg-primary text-primary-foreground">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <UserProfileDialog 
        userId={selectedProfileId} 
        open={isProfileDialogOpen} 
        onOpenChange={setIsProfileDialogOpen} 
      />
    </Card>
  );
};