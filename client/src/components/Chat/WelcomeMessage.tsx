import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Settings, Sparkles } from 'lucide-react';

export const WelcomeMessage = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2 flex items-center justify-center">
            <Sparkles className="h-8 w-8 mr-2 text-primary" />
            Welcome to Chat Rescuer!
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Your Supabase to Replit migration is complete. Start exploring your chat features!
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
                Find and connect with friends and colleagues
              </p>
            </div>
            <div className="text-center p-4 rounded-lg border border-border bg-background/50">
              <Settings className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Customize Profile</h3>
              <p className="text-sm text-muted-foreground">
                Set up your profile and preferences
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Migration Complete!</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Your account is active immediately (no email verification needed)</li>
              <li>✓ Session-based authentication for secure access</li>
              <li>✓ PostgreSQL database with full chat functionality</li>
              <li>✓ Real-time messaging system ready to use</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Use the sidebar navigation to explore: <strong>Chats</strong>, <strong>Contacts</strong>, and <strong>Settings</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};