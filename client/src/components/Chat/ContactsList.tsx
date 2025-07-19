import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Search, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  userId: number;
  contactId: number;
  status: string;
  createdAt: string;
  contactProfile?: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string;
  };
}

interface ContactsListProps {
  onStartConversation?: (conversationId: string) => void;
}

export const ContactsList = ({ onStartConversation }: ContactsListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading: loading } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: !!user,
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactData: { contactId: number }) => {
      return apiRequest('/api/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setNewContactEmail('');
      setIsDialogOpen(false);
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

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactEmail.trim()) return;

    try {
      // First search for user by email
      const searchResponse = await apiRequest(`/api/users/search?email=${encodeURIComponent(newContactEmail.trim())}`);
      
      if (!searchResponse.user) {
        toast({
          title: 'User not found',
          description: 'No user found with that email address',
          variant: 'destructive',
        });
        return;
      }

      await addContactMutation.mutateAsync({ contactId: searchResponse.user.id });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contact',
        variant: 'destructive',
      });
    }
  };

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

  const handleStartConversation = async (contactId: number) => {
    await startConversationMutation.mutateAsync(contactId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredContacts = contacts.filter((contact: Contact) =>
    contact.contactProfile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.contactProfile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-chat-sidebar-foreground">Contacts</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <UserPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter contact's email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addContactMutation.isPending}>
                  {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-chat-sidebar-foreground">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm opacity-75">No contacts yet</p>
            <p className="text-xs opacity-50 mt-1">Add some contacts to start chatting</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredContacts.map((contact: Contact) => (
              <div
                key={contact.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-chat-sidebar-hover cursor-pointer"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.contactProfile?.avatarUrl || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(contact.contactProfile?.fullName || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-chat-sidebar-foreground truncate">
                    {contact.contactProfile?.fullName || 'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{contact.contactProfile?.username || 'unknown'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleStartConversation(contact.contactId)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};