/**
 * @fileoverview Custom hooks for Spotify API operations using TanStack Query.
 *
 * Provides optimized data fetching with caching, error handling, and loading states.
 */
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui'
import { checkPermissionError, handlePermissionError } from '@/lib/permissions'
import type { Song } from '@/stores/playlist-store'

/**
 * @description Fetches user's top songs with caching and error handling.
 */
export function useTopSongs() {
    const { data: session } = useSession()
    const { addToast } = useToast()

    const handleReconnect = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/'
        }
    }

    return useQuery({
        queryKey: ['top-songs', session?.user?.id],
        queryFn: async (): Promise<Song[]> => {
            const response = await fetch('/api/spotify/users/top-songs')

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const error = new Error(errorData.error || 'Failed to fetch top songs')
                    ; (error as any).status = response.status
                throw error
            }

            return response.json()
        },
        enabled: !!session?.user?.id,
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
            const permissionError = checkPermissionError(error)
            if (permissionError) {
                handlePermissionError(permissionError, handleReconnect)
                addToast({
                    type: 'error',
                    title: 'Permission Error',
                    message: permissionError.message
                })
                return false
            }
            return failureCount < 2
        },
    })
}

/**
 * @description Fetches or creates user's SMAS playlist.
 */
export function useSMASPlaylist() {
    const { data: session } = useSession()
    const { addToast } = useToast()

    const handleReconnect = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/'
        }
    }

    return useQuery({
        queryKey: ['smas-playlist', session?.user?.id],
        queryFn: async () => {
            const response = await fetch('/api/spotify/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const error = new Error(errorData.error || 'Failed to fetch playlist')
                    ; (error as any).status = response.status
                throw error
            }

            return response.json()
        },
        enabled: !!session?.user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            const permissionError = checkPermissionError(error)
            if (permissionError) {
                handlePermissionError(permissionError, handleReconnect)
                addToast({
                    type: 'error',
                    title: 'Permission Error',
                    message: permissionError.message
                })
                return false
            }
            return failureCount < 2
        },
    })
}

/**
 * @description Mutation for contributing songs to a playlist.
 */
export function useContributeSongs() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ playlistId, trackUris, linkSlug }: { playlistId: string; trackUris: string[]; linkSlug?: string }) => {
            const response = await fetch('/api/spotify/contribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playlistId, trackUris, linkSlug })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to contribute songs')
            }

            return response.json()
        },
        onSuccess: () => {
            // Invalidate and refetch playlist data
            queryClient.invalidateQueries({ queryKey: ['smas-playlist'] })
        },
        onError: (error) => {
            console.log(error)
        },
    })
}

/**
 * @description Fetches sharing link data.
 */
export function useSharingLink(linkSlug: string) {

    return useQuery({
        queryKey: ['sharing-link', linkSlug],
        queryFn: async () => {
            const response = await fetch(`/api/sharing/${linkSlug}`)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to fetch sharing link')
            }

            return response.json()
        },
        enabled: !!linkSlug,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: (failureCount, error) => {
            if (error instanceof Error && error.message.includes('not found')) {
                return false // Don't retry for not found errors
            }
            return failureCount < 2
        },
    })
} 