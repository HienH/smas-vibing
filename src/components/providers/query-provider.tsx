/**
 * @fileoverview TanStack Query provider for data fetching and caching.
 *
 * Provides centralized data fetching with caching, background updates, and error handling.
 */
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

interface QueryProviderProps {
    children: ReactNode
}

/**
 * @description TanStack Query provider with optimized configuration.
 */
export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Retry failed requests
                        retry: (failureCount, error) => {
                            // Don't retry on 4xx errors (client errors)
                            if (error instanceof Error && error.message.includes('4')) {
                                return false
                            }
                            return failureCount < 3
                        },
                        // Refetch on window focus
                        refetchOnWindowFocus: false,
                        // Stale time for data
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        // Cache time
                        gcTime: 10 * 60 * 1000, // 10 minutes
                        // Show loading state immediately
                        refetchOnMount: true,
                    },
                    mutations: {
                        // Retry mutations
                        retry: 1,
                        // Show loading state
                        networkMode: 'online',
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    )
} 