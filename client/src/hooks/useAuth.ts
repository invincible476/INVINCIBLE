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
    // Check if user is authenticated using JWT token from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
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
      
      // Store JWT token in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
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
      const response = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store JWT token in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      // Set user state
      setUser(response.user);
      setLoading(false);
      
      // Fetch full auth data including profile
      try {
        const authResponse = await apiRequest('/api/auth/me');
        setUser(authResponse.user);
        setProfile(authResponse.profile);
      } catch (error) {
        console.error('Post-signin auth check failed:', error);
      }
      
      return { data: response, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      await apiRequest('/api/auth/signout', {
        method: 'POST',
      });
      
      // Remove JWT token from localStorage
      localStorage.removeItem('authToken');
      
      setUser(null);
      setProfile(null);
      
      return { error: null };
    } catch (error: any) {
      // Even if API call fails, clear local state
      localStorage.removeItem('authToken');
      setUser(null);
      setProfile(null);
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