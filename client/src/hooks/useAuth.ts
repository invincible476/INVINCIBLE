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
  return useQuery({
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
          return {
            user: data.user,
            profile: data.profile
          };
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
};