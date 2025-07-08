/**
 * @fileoverview Custom hook for dashboard data initialization and state.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { usePlaylistStore } from '@/stores/playlist-store'
import { useFirebase } from '@/hooks/use-firebase'
import { Contribution } from '@/types/firebase'

export const useDashboardData = (userId?: string) => {
  const { setTopSongs, setPlaylist, setLoading, setError } = usePlaylistStore()
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [shareLinkUsage, setShareLinkUsage] = useState(0)
  const hasInitialized = useRef(false)
  const { getPlaylistContributions, getUserSharingLink } = useFirebase()

  const handleRetry = useCallback(() => {
    hasInitialized.current = false
    setIsInitializing(true)
    setHasError(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    const initializeDashboard = async () => {
      if (userId && !hasInitialized.current) {
        hasInitialized.current = true
        setLoading(true)
        setError(false)
        setHasError(false)

        try {
          const topSongsResponse = await fetch('/api/spotify/users/top-songs')
          if (topSongsResponse.ok) {
            const songs = await topSongsResponse.json()
            if (isMounted) setTopSongs(songs)
          }

          const playlistResponse = await fetch('/api/spotify/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          let playlist = null
          if (playlistResponse.ok) {
            playlist = await playlistResponse.json()
          }

          if (isMounted && playlist) {
            setPlaylist(playlist)

            // Fetch contributions for this playlist
            const contribRes = await getPlaylistContributions(playlist.firestoreId || '')

            if (contribRes.success && Array.isArray(contribRes.data)) {
              setContributions(contribRes.data)
            }

            // Fetch share link usage
            const linkRes = await getUserSharingLink(userId)
            if (linkRes.success && linkRes.data) {
              setShareLinkUsage(linkRes.data.usageCount || 0)
            }
          }
        } catch (error) {
          console.log(error)
          if (isMounted) setHasError(true)
        } finally {
          if (isMounted) {
            setLoading(false)
            setIsInitializing(false)
          }
        }
      } else if (userId && hasInitialized.current) {
        setIsInitializing(false)
      }
    }

    initializeDashboard()

    return () => {
      isMounted = false
    }
  }, [userId, setTopSongs, setPlaylist, setLoading, setError, getPlaylistContributions, getUserSharingLink])

  useEffect(() => {
    if (!userId) {
      hasInitialized.current = false
      setIsInitializing(true)
      setHasError(false)
    }
  }, [userId])

  return { isInitializing, hasError, handleRetry, contributions, shareLinkUsage }
} 