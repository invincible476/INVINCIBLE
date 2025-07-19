import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/utils';

interface User {
  id: number;
  email: string;
}

interface Profile {
  id: string;
  userId: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  status?: string;
}

interface AuthData {
  user: User;
  profile: Profile;
}

interface SignInData {
  email: string;
  password: string;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<AuthData | null>({
    queryKey: ['auth'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        return null;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            console.log('Token expired or invalid');
          }
          return null;
        }

        const data = await response.json();
        console.log('Auth check successful:', data);
        return data;
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('authToken');
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const signInMutation = useMutation({
    mutationFn: async (credentials: SignInData) => {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sign in failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(['auth'], { user: data.user, profile: data.profile });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      console.error('Sign in error:', error);
      localStorage.removeItem('authToken');
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (userData: SignUpData) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sign up failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(['auth'], { user: data.user, profile: data.profile });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      console.error('Sign up error:', error);
      localStorage.removeItem('authToken');
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/signout', { method: 'POST' });
    },
    onSuccess: () => {
      localStorage.removeItem('authToken');
      queryClient.setQueryData(['auth'], null);
      queryClient.clear();
    },
  });

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading,
    error,
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    refetch,
  };
};