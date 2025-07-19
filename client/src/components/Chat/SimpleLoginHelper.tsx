
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export const SimpleLoginHelper = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Successfully logged in!',
      });
    }
    setLoading(false);
  };

  const useTestCredentials = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Quick Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              'Logging in...'
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Test with existing accounts:</p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => useTestCredentials('yagamilightkun1986@gmail.com', 'password123')}
            >
              Use Yagami Account
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => useTestCredentials('invincibleshinmen@gmail.com', 'password123')}
            >
              Use Shinmen Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
