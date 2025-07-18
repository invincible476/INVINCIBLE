import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/Auth/AuthForm';
import { ChatLayout } from '@/components/Chat/ChatLayout';
import { useEffect, useState } from 'react';

const Index = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    console.log('Index component state:', { user: !!user, loading, userObject: user });
    if (user && !loading) {
      console.log('Setting showAuth to false - should show chat interface');
      setShowAuth(false);
    } else if (!user && !loading) {
      console.log('Setting showAuth to true - should show auth form');
      setShowAuth(true);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuth || !user) {
    return <AuthForm />;
  }

  return <ChatLayout />;
};

export default Index;
