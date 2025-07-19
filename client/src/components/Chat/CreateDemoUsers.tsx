import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CreateDemoUsers = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createDemoUsers = async () => {
    setIsCreating(true);
    
    const demoUsers = [
      {
        email: 'jane@example.com',
        password: 'password123',
        fullName: 'Jane Smith',
        username: 'janesmith',
      },
      {
        email: 'bob@example.com',
        password: 'password123',
        fullName: 'Bob Wilson',
        username: 'bobwilson',
      },
      {
        email: 'alice@example.com',
        password: 'password123',
        fullName: 'Alice Johnson',
        username: 'alicejohnson',
      },
    ];

    let createdCount = 0;
    
    for (const user of demoUsers) {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });
        
        if (response.ok) {
          createdCount++;
        }
      } catch (error) {
        console.log(`User ${user.email} might already exist, skipping...`);
      }
    }

    setIsCreating(false);
    
    toast({
      title: 'Demo Users Ready!',
      description: `Created ${createdCount} demo users. Now check the "Discover" tab to see all available users.`,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Create Demo Users</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Create some demo users to test the discovery and chat features
        </p>
        
        <Button 
          onClick={createDemoUsers}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating demo users...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Demo Users
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Will create:</p>
          <p>• jane@example.com (Jane Smith)</p>
          <p>• bob@example.com (Bob Wilson)</p>
          <p>• alice@example.com (Alice Johnson)</p>
        </div>
      </CardContent>
    </Card>
  );
};