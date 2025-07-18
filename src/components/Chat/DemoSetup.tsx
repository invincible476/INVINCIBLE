import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, UserPlus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DemoSetup = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createDemoData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create demo contacts (simulated users)
      const demoUsers = [
        { full_name: 'Alice Johnson', username: 'alice_j', user_id: 'demo-user-1' },
        { full_name: 'Bob Smith', username: 'bob_smith', user_id: 'demo-user-2' },
        { full_name: 'Charlie Brown', username: 'charlie_b', user_id: 'demo-user-3' },
      ];

      // Insert demo profiles
      for (const demoUser of demoUsers) {
        await supabase.from('profiles').upsert({
          ...demoUser,
          status: 'Available',
        });

        // Add as contacts
        await supabase.from('contacts').upsert({
          user_id: user.id,
          contact_id: demoUser.user_id,
          status: 'accepted',
        });
      }

      // Create demo conversations
      for (const demoUser of demoUsers) {
        // Create conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            is_group: false,
            created_by: user.id,
          })
          .select()
          .single();

        if (convError) throw convError;

        // Add participants
        await supabase.from('conversation_participants').insert([
          {
            conversation_id: conversation.id,
            user_id: user.id,
          },
          {
            conversation_id: conversation.id,
            user_id: demoUser.user_id,
          },
        ]);

        // Add some demo messages
        await supabase.from('messages').insert([
          {
            conversation_id: conversation.id,
            sender_id: demoUser.user_id,
            content: `Hello! I'm ${demoUser.full_name}. Nice to meet you!`,
            message_type: 'text',
          },
          {
            conversation_id: conversation.id,
            sender_id: user.id,
            content: `Hi ${demoUser.full_name}! Great to connect with you.`,
            message_type: 'text',
          },
        ]);
      }

      toast({
        title: 'Demo data created!',
        description: 'You now have demo contacts and conversations to try out the chat features.',
      });

      // Refresh the page to load new data
      window.location.reload();
    } catch (error) {
      console.error('Error creating demo data:', error);
      toast({
        title: 'Error',
        description: 'Failed to create demo data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle className="text-xl">Welcome to Chat Rescuer!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your chat app is ready! To get started, let's create some demo data so you can explore all the features.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">Demo Contacts</h4>
                <p className="text-sm text-muted-foreground">3 sample contacts to chat with</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">Sample Conversations</h4>
                <p className="text-sm text-muted-foreground">Ready-made chats with messages</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium">Contact Management</h4>
                <p className="text-sm text-muted-foreground">Add and manage your contacts</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={createDemoData} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Creating Demo Data...' : 'Create Demo Data & Start Chatting'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            You can also start fresh by adding real contacts in the Contacts tab
          </p>
        </CardContent>
      </Card>
    </div>
  );
};