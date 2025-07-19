` tags, ensuring that no parts are skipped or omitted.

```
<replit_final_file>
import { QueryClient } from '@tanstack/react-query';
import { apiRequest } from './utils';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return apiRequest(url);
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.message?.includes('Authentication failed') || error?.message?.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Export the apiRequest function for direct use
export { apiRequest };