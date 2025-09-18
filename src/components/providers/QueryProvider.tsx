'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { setupInterceptors } from '@/lib/api-client';
import { useEffect } from 'react';
import { queryClient as exportedQueryClient } from '@/lib/query-client';
import { useChatStore } from '@/stores/useChatStore';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    setupInterceptors();
  }, []);

  // Attach the same QueryClient instance to the chat store so socket handlers
  // can invalidate queries directly.
  useEffect(() => {
    try {
      const setQc = useChatStore.getState().setQueryClient;
      if (setQc) setQc(exportedQueryClient);
    } catch (e) {
      // do not crash if store is unavailable
      console.warn('[QueryProvider] failed to set query client on chat store', e);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
