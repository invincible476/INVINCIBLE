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

  // Clear auth state when token becomes invalid
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue) {
        setUser(null);
        setProfile(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth check successful:', data);
        setUser(data.user);
        setProfile(data.profile);
      } else {
        console.log('Auth check failed - invalid token');
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
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName, username }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }
      
      const data = await response.json();
      
      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        
        // Set user and profile immediately from signup response
        setUser(data.user);
        if (data.profile) {
          setProfile(data.profile);
        }
        
        // Fetch the latest auth status to ensure consistency
        await checkAuthStatus();
      }
      
      setLoading(false);
      return { data, error: null };
    } catch (error: any) {
      setLoading(false);
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        
        // Set user and profile immediately from login response
        setUser(data.user);
        if (data.profile) {
          setProfile(data.profile);
        }
        
        // Also fetch the latest auth status to ensure consistency
        await checkAuthStatus();
      }
      
      setLoading(false);
      return { data, error: null };
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