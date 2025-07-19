
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/utils';

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  participants: Array<{
    id: string;
    userId: number;
    user: {
      id: number;
      profile: {
        username: string;
        fullName: string;
        avatarUrl?: string;
      };
    };
  }>;
  lastMessage?: {
    id: string;
    content: string;
    senderId: number;
    createdAt: string;
    sender: {
      profile: {
        username: string;
        fullName: string;
      };
    };
  };
}

export const useConversations = () => {
  const {
    data: conversations = [],
    isLoading: loading,
    refetch: refreshConversations,
    error
  } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: () => apiRequest('/api/conversations'),
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  return {
    conversations: conversations as Conversation[],
    loading,
    refreshConversations,
    error
  };
};
