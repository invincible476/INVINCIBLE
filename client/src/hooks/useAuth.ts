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
    mutationFn: async (credentials: SignInData): Promise<{ user: User; profile: Profile; token: string }> => {
      console.log('Attempting sign in for:', credentials.email);

      // Clear any existing token first
      localStorage.removeItem('authToken');

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password.trim()
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = 'Sign in failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use default message
          if (response.status === 401) {
            errorMessage = 'Invalid email or password';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Sign in successful:', data);

      if (!data.token || !data.user || !data.profile) {
        throw new Error('Invalid response from server');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Setting auth token and updating cache');
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(['auth'], { user: data.user, profile: data.profile });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      console.error('Sign in mutation error:', error);
      localStorage.removeItem('authToken');
      queryClient.setQueryData(['auth'], null);
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (userData: SignUpData): Promise<{ user: User; profile: Profile; token: string }> => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        let errorMessage = 'Sign up failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
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
      await fetch('/api/auth/signout', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      localStorage.removeItem('authToken');
      queryClient.setQueryData(['auth'], null);
      queryClient.clear();
    },
  });

  // Create a wrapper function that returns both result and error
  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInMutation.mutateAsync({ email, password });
      console.log('Sign in wrapper - success:', result);
      return { error: null, data: result };
    } catch (error: any) {
      console.error('Sign in wrapper - error:', error);
      return { error: { message: error.message || 'Sign in failed' } };
    }
  };

  const signUp = async (userData: SignUpData) => {
    try {
      await signUpMutation.mutateAsync(userData);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading,
    error,
    signIn,
    signUp,
    signOut: signOutMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    refetch,
  };
};