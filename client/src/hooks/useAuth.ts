import { useState, useEffect } from 'react';
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
    checkAuthStatus();
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
        console.log('Auth check failed - clearing token');
        localStorage.removeItem('authToken');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.log('Auth check error:', error);
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

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        // Force a small delay to ensure state updates
        setTimeout(() => {
          checkAuthStatus();
        }, 100);
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    } finally {
      setLoading(false);
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

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        // Force a small delay to ensure state updates properly
        setTimeout(() => {
          checkAuthStatus();
        }, 100);
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('authToken');
      setUser(null);
      setProfile(null);

      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return { error: null };
    } catch (error: any) {
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