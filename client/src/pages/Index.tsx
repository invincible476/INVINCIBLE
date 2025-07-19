
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/Auth/AuthForm';
import { ChatLayout } from '@/components/Chat/ChatLayout';

const Index = () => {
  const { user, loading } = useAuth();

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

  return user ? <ChatLayout /> : <AuthForm />;
};

export default Index;
