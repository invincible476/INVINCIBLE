import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface User {
  id: number;
  email: string;
}

export interface Profile {
  id: string;
  userId: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthData {
  user: User;
  profile: Profile;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<AuthData>({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const data = await response.json();
        console.log('Auth check successful:', data);
        return data;
      } catch (error) {
        console.log('Auth check error:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
  });

  const signInMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to sign in');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Signed in successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      username: string; 
      fullName: string 
    }) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to sign up');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Account created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth'], null);
      queryClient.clear();
      toast.success('Signed out successfully');
    },
  });

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading,
    error,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    refetch,
  };
}