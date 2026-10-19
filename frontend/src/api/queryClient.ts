import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        // Do not retry 4xx errors
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30 * 1000,
    },
  },
});

