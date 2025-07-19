import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/Auth/AuthForm';
import { ChatLayout } from '@/components/Chat/ChatLayout';
import { useEffect } from 'react';

export default function Index() {
  const { user, isLoading } = useAuth();

  console.log('Index component - user:', user, 'loading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('Rendering AuthForm - no authenticated user');
    return <AuthForm />;
  }

  console.log('Rendering ChatLayout - user authenticated');
  return <ChatLayout />;
}