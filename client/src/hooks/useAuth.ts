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
      
      if (response.user) {
        setUser(response.user);
        setProfile(response.profile);
      } else {
        // Clear invalid token
        localStorage.removeItem('authToken');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      // User is not authenticated
      localStorage.removeItem('authToken');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      setLoading(true);
      
      const response = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, username }),
      });
      
      // Store JWT token in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
        // Fetch profile after signup
        await checkAuthStatus();
      }
      
      setLoading(false);
      return { data: response, error: null };
    } catch (error: any) {
      setLoading(false);
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store JWT token in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
        // Fetch full auth data including profile
        await checkAuthStatus();
      }
      
      setLoading(false);
      return { data: response, error: null };
    } catch (error: any) {
      setLoading(false);
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