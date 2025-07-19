import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, MessageSquare, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  profile?: {
    fullName: string;
    username: string;
    avatarUrl: string;
    status: string;
  };
  isContact?: boolean;
}

interface UserDiscoveryProps {
  onStartConversation?: (conversationId: string) => void;
}

export const UserDiscovery = ({ onStartConversation }: UserDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['/api/users/all'],
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: !!user,
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ contactId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/all'] });
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contact',
        variant: 'destructive',
      });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          isGroup: false,
          participants: [contactId],
        }),
      });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (onStartConversation) {
        onStartConversation(conversation.id);
      }
      toast({
        title: 'Success',
        description: 'Conversation started',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start conversation',
        variant: 'destructive',
      });
    },
  });

  const filteredUsers = allUsers.filter((u: User) => {
    if (u.id === user?.id) return false; // Don't show current user
    
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(query) ||
      u.profile?.fullName?.toLowerCase().includes(query) ||
      u.profile?.username?.toLowerCase().includes(query)
    );
  });

  const contactIds = new Set(contacts.map((c: any) => c.contactId));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddContact = async (userId: number) => {
    await addContactMutation.mutateAsync(userId);
  };

  const handleStartConversation = async (userId: number) => {
    await startConversationMutation.mutateAsync(userId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-chat-sidebar-foreground">Discover Users</h2>
            <p className="text-sm text-muted-foreground">
              {filteredUsers.length} users available • {contacts.length} contacts
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {allUsers.length} total
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No other users found'}
              </p>
            </div>
          ) : (
            filteredUsers.map((otherUser: User) => {
              const isContact = contactIds.has(otherUser.id);
              
              return (
                <Card key={otherUser.id} className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser.profile?.avatarUrl || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(otherUser.profile?.fullName || otherUser.email)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground truncate">
                              {otherUser.profile?.fullName || 'Unknown User'}
                            </h3>
                            {isContact && (
                              <Badge variant="secondary" className="text-xs">
                                Contact
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            @{otherUser.profile?.username || 'unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {otherUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isContact ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddContact(otherUser.id)}
                            disabled={addContactMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStartConversation(otherUser.id)}
                            disabled={startConversationMutation.isPending}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};