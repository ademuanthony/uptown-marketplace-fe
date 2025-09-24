'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each user session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors except 408, 429
              const errorWithStatus = error as { status?: number };
              const status = errorWithStatus?.status;
              if (status && status >= 400 && status < 500 && ![408, 429].includes(status)) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
