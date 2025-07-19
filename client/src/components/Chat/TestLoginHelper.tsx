import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Copy, Eye, EyeOff } from 'lucide-react';

export const TestLoginHelper = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('test@chatrescuer.com');
  const [testPassword, setTestPassword] = useState('test123');
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  const createTestAccount = async () => {
    setCreating(true);
    try {
      const { error } = await signUp(testEmail, testPassword, 'Test User', 'testuser');
      
      if (error) {
        if (error.message.includes('already taken')) {
          toast({
            title: 'Account exists!',
            description: 'Test account already exists. Try logging in with the credentials below.',
          });
        } else {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Test account created!',
          description: 'You can now use these credentials to test the app.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create test account',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const testLogin = async () => {
    const { error } = await signIn(testEmail, testPassword);
    
    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login successful!',
        description: 'Welcome to Chat Rescuer',
      });
    }
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${testEmail}\nPassword: ${testPassword}`);
    toast({
      title: 'Copied!',
      description: 'Credentials copied to clipboard',
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Test Login Helper</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Test Email</Label>
          <Input 
            value={testEmail} 
            onChange={(e) => setTestEmail(e.target.value)}
            readOnly
          />
        </div>
        
        <div className="space-y-2">
          <Label>Test Password</Label>
          <div className="relative">
            <Input 
              type={showPassword ? 'text' : 'password'}
              value={testPassword} 
              onChange={(e) => setTestPassword(e.target.value)}
              readOnly
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={copyCredentials}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          
          <Button 
            onClick={createTestAccount}
            disabled={creating}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {creating ? 'Creating...' : 'Create Account'}
          </Button>
        </div>

        <Button 
          onClick={testLogin}
          className="w-full"
        >
          Test Login
        </Button>

        <div className="text-sm text-muted-foreground text-center">
          Use these credentials to test the login functionality
        </div>
      </CardContent>
    </Card>
  );
};