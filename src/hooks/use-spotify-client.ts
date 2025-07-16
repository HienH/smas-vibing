/**
 * @fileoverview Spotify client hook - Custom hook for Spotify API operations.
 *
 * Handles fetching top songs and creating playlists.
 */
import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePlaylistStore, type Song, type Playlist } from '@/stores/playlist-store'

/**
 * @description Custom hook for Spotify API operations.
 * @returns {Object} Spotify client methods and state.
 */
export function useSpotifyClient() {
  const { data: session } = useSession()
  const { setTopSongs, setPlaylist, setLoading, setError } = usePlaylistStore()

  /**
   * @description Fetches user's top 5 songs from Spotify API.
   * @returns {Promise<void>}
   */
  const fetchTopSongs = useCallback(async () => {
    if (!session?.user) return

    setLoading(true)
    setError(false)

    try {
      const response = await fetch('/api/spotify/users/top-songs')

      if (response.status === 401) {
        // Token expired, redirect to login
        window.location.href = '/'
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch top songs')
      }

      const songs: Song[] = await response.json()
      setTopSongs(songs)
    } catch (error) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, setTopSongs, setLoading, setError])

  /**
   * @description Creates or retrieves the user's SMAS playlist.
   * @returns {Promise<void>}
   */
  const createPlaylist = useCallback(async () => {
    if (!session?.user) return

    setLoading(true)
    setError(false)

    try {
      const response = await fetch('/api/spotify/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.status === 401) {
        // Token expired, redirect to login
        window.location.href = '/'
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create playlist')
      }

      const playlist: Playlist = await response.json()
      setPlaylist(playlist)
    } catch (error) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, setPlaylist, setLoading, setError])

  return {
    fetchTopSongs,
    createPlaylist
  }
} 