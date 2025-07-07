/**
 * @fileoverview Dashboard content component for the main user interface.
 *
 * Handles playlist management, top songs display, and sharing functionality.
 */
'use client'

import { useSession } from 'next-auth/react'
import { LoadingState, ErrorMessage, useToast } from '@/components/ui'
import { PlaylistCard } from '@/components/playlist/playlist-card'
import { TopSongsCard } from '@/components/playlist/top-songs-card'
import { ShareLinkCard } from '@/components/sharing/share-link-card'
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { UserMenu } from '@/components/auth/user-menu'
import { useTopSongs, useSMASPlaylist } from '@/hooks/use-spotify-queries'
import { useFirebase } from '@/hooks/use-firebase'
import { useEffect, useState } from 'react'
import type { Contribution } from '@/types/firebase'

/**
 * @description Renders the main dashboard content with playlist and sharing functionality.
 * @returns {JSX.Element} The dashboard content component.
 */
export function DashboardContent() {
  const { data: session } = useSession()
  const { addToast } = useToast()
  const { getPlaylistContributions, getUserSharingLink } = useFirebase()

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

  // Local state for contributions and share link usage
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [shareLinkUsage, setShareLinkUsage] = useState(0)
  const [isLoadingContributions, setIsLoadingContributions] = useState(false)

  // Load contributions when playlist is available
  useEffect(() => {
    if (playlist?.firestoreId && session?.user?.id) {
      setIsLoadingContributions(true)

      const loadContributions = async () => {
        try {
          const contribRes = await getPlaylistContributions(playlist.firestoreId)
          if (contribRes.success && Array.isArray(contribRes.data)) {
            setContributions(contribRes.data)
          }

          // Load share link usage
          const linkRes = await getUserSharingLink(session.user.id)
          if (linkRes.success && linkRes.data) {
            setShareLinkUsage(linkRes.data.usageCount || 0)
          }
        } catch (error) {
          addToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to load contribution data'
          })
        } finally {
          setIsLoadingContributions(false)
        }
      }

      loadContributions()
    }
  }, [playlist?.firestoreId, session?.user?.id, getPlaylistContributions, getUserSharingLink, addToast])

  const handleRetry = () => {
    window.location.reload()
  }

  const isLoading = isLoadingTopSongs || isLoadingPlaylist || isLoadingContributions
  const hasError = topSongsError || playlistError

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
  const totalTracks = contributions.reduce((sum: number, contribution: Contribution) => sum + contribution.tracks.length, 0)

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