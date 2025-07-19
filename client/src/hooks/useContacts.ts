
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/utils';

export interface Contact {
  id: string;
  userId: number;
  contactUserId: number;
  createdAt: string;
  contactUser: {
    id: number;
    email: string;
    profile: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
      status?: string;
      lastSeen?: string;
    };
  };
}

export const useContacts = () => {
  const {
    data: contacts = [],
    isLoading: loading,
    refetch: refreshContacts,
    error
  } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: () => apiRequest('/api/contacts'),
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  return {
    contacts: contacts as Contact[],
    loading,
    refreshContacts,
    error
  };
};
