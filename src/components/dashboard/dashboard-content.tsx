/**
 * @fileoverview DashboardContent - Main dashboard component with playlist management and sharing.
 *
 * Handles user's SMAS playlist, top 5 songs display, sharing link generation, and contributor tracking.
 */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { PlaylistCard } from '@/components/playlist/playlist-card'
import { TopSongsCard } from '@/components/playlist/top-songs-card'
import { ShareLinkCard } from '@/components/sharing/share-link-card'
import { usePlaylistStore } from '@/stores/playlist-store'
import { useSpotifyClient } from '@/hooks/use-spotify-client'

/**
 * @description Renders the main dashboard content with playlist and sharing functionality.
 * @returns {JSX.Element} The dashboard content component.
 */
export function DashboardContent() {
  const { data: session } = useSession()
  const { playlist, isLoading, hasError } = usePlaylistStore()
  const { createPlaylist, fetchTopSongs } = useSpotifyClient()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeDashboard = async () => {
      if (session?.user) {
        try {
          // Fetch user's top 5 songs
          await fetchTopSongs()
          
          // Create or get existing SMAS playlist
          await createPlaylist()
        } catch (error) {
          console.error('Failed to initialize dashboard:', error)
        } finally {
          setIsInitializing(false)
        }
      }
    }

    initializeDashboard()
  }, [session, createPlaylist, fetchTopSongs])

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your SMAS playlist...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load your playlist. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600">
          Your SMAS playlist is ready to grow with music from friends.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <PlaylistCard />
          <TopSongsCard />
        </div>
        <div>
          <ShareLinkCard />
        </div>
      </div>
    </div>
  )
} 