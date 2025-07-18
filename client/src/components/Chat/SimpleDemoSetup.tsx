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

  const createDemoMutation = useMutation({
    mutationFn: async () => {
      // For now, just create a simple demo conversation
      return apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Demo Chat',
          isGroup: false,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: 'Demo data created!',
        description: 'You can now explore the chat features.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create demo data',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2 flex items-center justify-center">
            <Sparkles className="h-8 w-8 mr-2 text-primary" />
            Welcome to Chat Rescuer!
          </CardTitle>
          <p className="text-muted-foreground">
            Get started by creating some demo data to explore the features
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
            <Button
              onClick={() => createDemoMutation.mutate()}
              disabled={createDemoMutation.isPending}
              size="lg"
              className="px-8"
            >
              {createDemoMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Creating Demo Data...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Demo Data
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              This will create sample conversations and contacts for you to explore
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};