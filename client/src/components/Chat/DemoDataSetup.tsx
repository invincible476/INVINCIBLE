import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SimpleLoginHelper } from './SimpleLoginHelper';

export const DemoDataSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const createDemoUserAndChat = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      // Create a demo user first (if it doesn't exist)
      let demoUser;
      try {
        const searchResponse = await apiRequest(`/api/users/search?email=demo@chatrescuer.com`);
        demoUser = searchResponse;
      } catch (error) {
        // Demo user doesn't exist, create it
        const signupResponse = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'demo@chatrescuer.com',
            password: 'demo123',
            fullName: 'Demo User',
            username: 'demo_user'
          }),
        });
        
        if (signupResponse.ok) {
          const data = await signupResponse.json();
          demoUser = { user: data.user };
        }
      }

      if (demoUser?.user) {
        // Add demo user as contact
        await apiRequest('/api/contacts', {
          method: 'POST',
          body: JSON.stringify({ contactId: demoUser.user.id }),
        });

        // Create conversation with demo user
        const conversation = await apiRequest('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            isGroup: false,
            participants: [demoUser.user.id],
          }),
        });

        // Send a welcome message
        await apiRequest(`/api/conversations/${conversation.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: '👋 Welcome to Chat Rescuer! This is a demo conversation. You can now start chatting with other users by adding them as contacts.',
          }),
        });

        // Refresh all data
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });

        toast({
          title: 'Demo Setup Complete!',
          description: 'You now have a demo contact and conversation ready to use.',
        });
      }
    } catch (error: any) {
      console.error('Demo setup error:', error);
      toast({
        title: 'Demo Setup Note',
        description: 'Demo user might already exist. Try creating your own contacts by adding other users by email.',
        variant: 'default',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 mr-2 text-primary" />
            Welcome to Chat Rescuer!
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Your real-time chat application is ready to use
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg border border-border bg-background/50">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Start Chatting</h3>
              <p className="text-sm text-muted-foreground">
                Create conversations and send messages instantly
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border border-border bg-background/50">
              <Users className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Add Contacts</h3>
              <p className="text-sm text-muted-foreground">
                Find and connect with other users by email
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border border-border bg-background/50">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Create Groups</h3>
              <p className="text-sm text-muted-foreground">
                Set up group chats with multiple participants
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Features Ready:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Real-time messaging with auto-refresh</li>
              <li>✓ User search and contact management</li>
              <li>✓ Group chat creation</li>
              <li>✓ Modern message bubbles with timestamps</li>
              <li>✓ Persistent authentication</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <SimpleLoginHelper />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};