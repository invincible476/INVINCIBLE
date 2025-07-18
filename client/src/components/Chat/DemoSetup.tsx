import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, UserPlus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DemoSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [skipDemo, setSkipDemo] = useState(false);

  const createDemoMutation = useMutation({
    mutationFn: async () => {
      try {
        // Create a demo conversation that user can start using immediately
        const conversation = await apiRequest('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Welcome Chat',
            isGroup: false,
          }),
        });
        
        // Send a welcome message to the conversation
        await apiRequest(`/api/conversations/${conversation.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: 'Welcome to Chat Rescuer! Your migration from Supabase to Replit is complete. You can now start chatting, adding contacts, and creating conversations.',
          }),
        });
        
        return conversation;
      } catch (error) {
        console.error('Demo creation error:', error);
        // If demo creation fails, just skip to the main interface
        setSkipDemo(true);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: 'Welcome!',
        description: 'Your chat environment is ready. Start messaging now!',
      });
    },
    onError: (error: any) => {
      console.error('Setup error:', error);
      toast({
        title: 'Skipping to chat interface',
        description: 'You can create conversations manually from the chat interface.',
      });
      // Skip demo and go directly to chat interface
      setSkipDemo(true);
    },
  });

  // If user wants to skip demo or demo failed, show main interface
  if (skipDemo) {
    // Force showing the main chat interface by updating parent component
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }, 100);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2 flex items-center justify-center">
            <Sparkles className="h-8 w-8 mr-2 text-primary" />
            Welcome to Chat Rescuer!
          </CardTitle>
          <p className="text-muted-foreground">
            Your Supabase to Replit migration is complete! Set up your chat environment to start messaging.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg border border-border">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Conversations</h3>
              <p className="text-sm text-muted-foreground">
                Start chatting with friends and colleagues
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border border-border">
              <Users className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Contacts</h3>
              <p className="text-sm text-muted-foreground">
                Manage your contacts and find new people
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border border-border">
              <UserPlus className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Groups</h3>
              <p className="text-sm text-muted-foreground">
                Create group chats for team collaboration
              </p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => createDemoMutation.mutate()}
                disabled={createDemoMutation.isPending}
                size="lg"
                className="px-8"
              >
                {createDemoMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Set Up Chat Environment
                  </>
                )}
              </Button>
              <Button
                onClick={() => setSkipDemo(true)}
                variant="outline"
                size="lg"
                className="px-8"
              >
                Skip to Chat Interface
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Set up a welcome conversation or skip directly to the chat interface
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};