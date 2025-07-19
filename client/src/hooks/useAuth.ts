import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: number;
  email: string;
}

export interface Profile {
  id: string;
  userId: number;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  status?: string;
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['/api/user'],
    queryFn: async (): Promise<User | null> => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        console.log('Auth check successful:', data);

        // Return the user data in the correct format
        if (data && data.user && data.profile) {
          return data.user; // Return just the user object
        }

        return null;
      } catch (error) {
        console.log('Auth check error:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.error || 'Sign in failed' } };
      }

      // Store token if provided
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.error || 'Sign up failed' } };
      }

      // Store token if provided
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Remove token
      localStorage.removeItem('auth-token');
      
      // Clear user data
      queryClient.setQueryData(['/api/user'], null);
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Sign out failed' } };
    }
  };

  // Separate profile query
  const profileQuery = useQuery({
    queryKey: ['/api/profile'],
    queryFn: async (): Promise<Profile | null> => {
      if (!query.data) return null;
      
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.profile || null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!query.data,
    retry: false,
  });

  return {
    ...query,
    user: query.data,
    profile: profileQuery.data,
    signIn,
    signUp,
    signOut,
  };
};