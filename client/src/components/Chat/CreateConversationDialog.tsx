import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  userId: number;
  contactId: number;
  status: string;
  contactProfile?: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string;
  };
}

interface CreateConversationDialogProps {
  onConversationCreated?: (conversationId: string) => void;
}

export const CreateConversationDialog = ({ onConversationCreated }: CreateConversationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationName, setConversationName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: isOpen,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: { name?: string; isGroup: boolean; participants: number[] }) => {
      return apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setIsOpen(false);
      setConversationName('');
      setSelectedContacts([]);
      setIsGroup(false);
      
      if (onConversationCreated) {
        onConversationCreated(conversation.id);
      }
      
      toast({
        title: 'Success',
        description: 'Conversation created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create conversation',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedContacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one contact',
        variant: 'destructive',
      });
      return;
    }

    if (isGroup && !conversationName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the group',
        variant: 'destructive',
      });
      return;
    }

    await createConversationMutation.mutateAsync({
      name: isGroup ? conversationName.trim() : undefined,
      isGroup,
      participants: selectedContacts,
    });
  };

  const handleContactToggle = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Conversation</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGroup"
              checked={isGroup}
              onCheckedChange={(checked) => setIsGroup(checked as boolean)}
            />
            <Label htmlFor="isGroup" className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Create group chat
            </Label>
          </div>

          {isGroup && (
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="Enter group name"
                value={conversationName}
                onChange={(e) => setConversationName(e.target.value)}
                required={isGroup}
              />
            </div>
          )}

          <div>
            <Label>Select Contacts</Label>
            <div className="max-h-48 overflow-y-auto space-y-2 mt-2 border rounded-lg p-2">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contacts available. Add some contacts first.
                </p>
              ) : (
                contacts.map((contact: Contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={selectedContacts.includes(contact.contactId)}
                      onCheckedChange={() => handleContactToggle(contact.contactId)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.contactProfile?.avatarUrl || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(contact.contactProfile?.fullName || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <Label htmlFor={`contact-${contact.id}`} className="flex-1 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium">
                          {contact.contactProfile?.fullName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{contact.contactProfile?.username || 'unknown'}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createConversationMutation.isPending || selectedContacts.length === 0}
          >
            {createConversationMutation.isPending ? 'Creating...' : 'Create Conversation'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};