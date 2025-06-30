/**
 * @fileoverview Dashboard content component for the main user interface.
 *
 * Handles playlist management, top songs display, and sharing functionality.
 */
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { LoadingSpinner, ErrorMessage } from '@/components/ui'
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
          await Promise.all([
            fetchTopSongs(),
            createPlaylist()
          ])
        } catch (error) {
          console.error('Failed to initialize dashboard:', error)
        } finally {
          setIsInitializing(false)
        }
      }
    }

    initializeDashboard()
  }, [session, createPlaylist, fetchTopSongs])

  const handleRetry = () => {
    window.location.reload()
  }

  if (isInitializing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner 
          size="lg" 
          text="Setting up your SMAS playlist..." 
        />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          message="Failed to load your playlist. Please try again."
          onRetry={handleRetry}
        />
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