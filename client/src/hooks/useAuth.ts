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
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        return null;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
          }
          console.log('Auth check failed:', response.status);
          return null;
        }

        const data = await response.json();
        console.log('Auth check successful:', data);
        return data;
      } catch (error) {
        console.log('Auth check error:', error);
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
      console.log('Sign in mutation success:', data);
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      // Create the auth data object
      const authData: AuthData = {
        user: data.user,
        profile: data.profile
      };
      
      // Set the query data and invalidate to trigger refetch
      queryClient.setQueryData(['auth'], authData);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Signed in successfully');
    },
    onError: (error) => {
      console.error('Sign in mutation error:', error);
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
      console.log('Sign up mutation success:', data);
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      // Create the auth data object
      const authData: AuthData = {
        user: data.user,
        profile: data.profile
      };
      
      // Set the query data and invalidate to trigger refetch
      queryClient.setQueryData(['auth'], authData);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Account created successfully');
    },
    onError: (error) => {
      console.error('Sign up mutation error:', error);
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
      localStorage.removeItem('authToken');
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