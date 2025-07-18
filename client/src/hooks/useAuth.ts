import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiRequest('/api/auth/me');
      setUser(response.user);
      setProfile(response.profile);
    } catch (error) {
      // User is not authenticated
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      const response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, username }),
      });
      
      setUser(response.user);
      // Fetch profile after signup
      await checkAuthStatus();
      
      return { data: response, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting signin...');
      const response = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Signin response received:', response);
      
      // Immediately set user state
      setUser(response.user);
      setLoading(false);
      
      // Also immediately fetch full auth data
      try {
        const authResponse = await apiRequest('/api/auth/me');
        console.log('Auth me response:', authResponse);
        setUser(authResponse.user);
        setProfile(authResponse.profile);
      } catch (error) {
        console.error('Post-signin auth check failed:', error);
      }
      
      return { data: response, error: null };
    } catch (error: any) {
      console.error('Signin failed:', error);
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      await apiRequest('/api/auth/signout', {
        method: 'POST',
      });
      
      setUser(null);
      setProfile(null);
      
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };
};