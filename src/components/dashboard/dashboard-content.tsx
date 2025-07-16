/**
 * @fileoverview Dashboard content component for the main user interface.
 *
 * Handles playlist management, top songs display, and sharing functionality.
 */
'use client'

import { LoadingState, ErrorMessage } from '@/components/ui'
import { PlaylistCard } from '@/components/playlist/playlist-card'
import { TopSongsCard } from '@/components/playlist/top-songs-card'
import { ShareLinkCard } from '@/components/sharing/share-link-card'
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { UserMenu } from '@/components/auth/user-menu'
import { useTopSongs, useSMASPlaylist } from '@/hooks/use-spotify-queries'
import { useQuery } from '@tanstack/react-query'
import type { Contribution } from '@/types/firebase'
import type { Session } from 'next-auth'

interface DashboardContentProps {
  session: Session
}

/**
 * @description Renders the main dashboard content with playlist and sharing functionality.
 * @returns {JSX.Element} The dashboard content component.
 */
export function DashboardContent({ session }: DashboardContentProps) {

  // TanStack Query hooks
  const {
    data: topSongs,
    isLoading: isLoadingTopSongs,
    error: topSongsError
  } = useTopSongs()

  const {
    data: playlist,
    isLoading: isLoadingPlaylist,
    error: playlistError
  } = useSMASPlaylist()


  console.log(playlist)
  console.log("playlisttttt")

  // Fetch contributions using TanStack Query
  const {
    data: contributionsData,
    isLoading: isLoadingContributions,
    error: contributionsError
  } = useQuery({
    queryKey: ['playlist-contributions', playlist?.firestoreId],
    queryFn: async () => {
      if (!playlist?.firestoreId) return { contributions: [] }
      const res = await fetch(`/api/spotify/playlists/${playlist.firestoreId}/contributions`)
      if (!res.ok) throw new Error('Failed to fetch contributions')
      return res.json()
    },
    enabled: !!playlist?.firestoreId,
  })

  // Fetch sharing link usage using TanStack Query
  const {
    data: sharingLinkData,
    isLoading: isLoadingSharingLink,
    error: sharingLinkError
  } = useQuery({
    queryKey: ['playlist-sharing-link', playlist?.firestoreId],
    queryFn: async () => {
      if (!playlist?.firestoreId) return { sharingLink: null }
      const res = await fetch(`/api/spotify/playlists/${playlist.firestoreId}/sharing-link`)
      if (!res.ok) throw new Error('Failed to fetch sharing link')
      return res.json()
    },
    enabled: !!playlist?.firestoreId,
  })

  const handleRetry = () => {
    window.location.reload()
  }

  const isLoading = isLoadingTopSongs || isLoadingPlaylist || isLoadingContributions || isLoadingSharingLink
  const hasError = topSongsError || playlistError || contributionsError || sharingLinkError

  const contributions = contributionsData?.contributions || []
  const shareLinkUsage = sharingLinkData?.sharingLink?.usageCount || 0

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState
          isLoading={true}
          text="Setting up your SMAS playlist..."
          size="lg"
          variant="spinner"
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

  // Calculate total tracks from contributions
  const totalTracks = contributions.reduce((sum: number, contribution: Contribution) => sum + contribution.spotifyTrackUris.length, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-green-700 mb-2">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-gray-600">
            Your SMAS playlist is ready. Share your playlist link with friends
          </p>
        </div>
        <UserMenu />
      </header>

      {/* Dashboard Metrics */}
      <DashboardMetrics
        contributions={contributions}
        totalTracks={totalTracks}
        shareLinkUsage={shareLinkUsage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <PlaylistCard contributions={contributions} />
        </div>
        <div className="space-y-6">
          <ShareLinkCard />
          <ActivityTimeline contributions={contributions} />
          <TopSongsCard songs={topSongs || []} isLoading={isLoadingTopSongs} />
        </div>
      </div>
    </div>
  )
} 