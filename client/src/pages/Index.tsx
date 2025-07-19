
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/Auth/AuthForm';
import { ChatLayout } from '@/components/Chat/ChatLayout';

export default function Index() {
  const { user, isLoading } = useAuth();

  console.log('Index component - user:', user, 'loading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <ChatLayout />;
}
