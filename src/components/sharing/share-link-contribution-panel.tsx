/**
 * @fileoverview Contribution panel for sharing link - handles friend contribution flow UI and logic.
 *
 * Used by ShareLinkPage. Receives all dependencies as props for testability.
 */
'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent, Button, LoadingSpinner } from '@/components/ui'
import { SongItem } from '@/components/playlist/song-item'

/**
 * @typedef {Object} ContributionPanelProps
 * @property {string} linkSlug
 * @property {any} session
 * @property {Function} getSharingLink
 * @property {Function} trackLinkUsage
 * @property {Function} checkContribution
 * @property {Function} addContribution
 * @property {Function} getPlaylist
 * @property {Function} getPlaylistTracks
 * @property {Function} addTracksToPlaylist
 */

/**
 * @description Handles the friend contribution flow for a sharing link.
 * @param {ContributionPanelProps} props
 */
export function ShareLinkContributionPanel({
  linkSlug,
  session,
  getSharingLink,
  trackLinkUsage,
  checkContribution,
  addContribution,
  getPlaylist,
  getPlaylistTracks,
  addTracksToPlaylist,
}: any) {
  const [state, setState] = useState({
    isLoading: true,
    isValid: false,
    ownerName: undefined as string | undefined,
    error: undefined as string | undefined,
    isContributing: false,
    isSuccess: false,
    successTracks: undefined as any[] | undefined,
    cooldownDays: undefined as number | undefined,
    noTopTracks: false,
    allDuplicates: false,
    cooldownUntil: undefined as string | undefined,
  })

  // Helper: Format date for cooldown
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    let isMounted = true
    const fetchLink = async () => {
      if (!linkSlug) return
      setState(s => ({ ...s, isLoading: true, isValid: false }))
      const result = await getSharingLink(linkSlug)
      if (!isMounted) return
      if (result.success && result.data?.isActive) {
        setState(s => ({ ...s, isLoading: false, isValid: true, ownerName: result.data.ownerName }))
        trackLinkUsage(result.data.id)
      } else {
        setState(s => ({ ...s, isLoading: false, isValid: false, error: 'Invalid or expired sharing link.' }))
      }
    }
    fetchLink()
    return () => { isMounted = false }
  }, [linkSlug, getSharingLink, trackLinkUsage])

  const handleContribute = async () => {
    if (!session) {
      if (typeof window !== 'undefined') {
        // Only call signIn in browser
        const { signIn } = await import('next-auth/react')
        signIn('spotify')
      }
      return
    }
    setState(s => ({ ...s, isContributing: true, error: undefined, isSuccess: false, noTopTracks: false, allDuplicates: false }))
    try {
      // 1. Get sharing link again for latest data
      const linkResult = await getSharingLink(linkSlug)
      if (!linkResult.success || !linkResult.data) throw new Error('Invalid sharing link')
      const { playlistId, ownerName } = linkResult.data
      // 2. Get playlist info (to get Spotify playlist ID)
      const playlistResult = await getPlaylist(playlistId)
      if (!playlistResult.success || !playlistResult.data) throw new Error('Playlist not found')
      const { spotifyPlaylistId } = playlistResult.data
      // 3. Check cooldown
      const cooldownResult = await checkContribution(playlistId, session.user.id)
      if (!cooldownResult.success) throw new Error('Failed to check contribution')
      if (cooldownResult.data?.hasContributed && cooldownResult.data.contribution) {
        // Calculate days left
        const expiresAt = cooldownResult.data.contribution.expiresAt.toDate()
        const now = new Date()
        const days = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        setState(s => ({ ...s, isContributing: false, cooldownDays: days, cooldownUntil: formatDate(expiresAt.toISOString()) }))
        return
      }
      // 4. Fetch contributor's top 5 songs
      const topRes = await fetch('/api/spotify/users/top-songs')
      if (!topRes.ok) {
        if (topRes.status === 401) throw new Error('Spotify session expired. Please re-authenticate.')
        throw new Error('Failed to fetch your top songs')
      }
      const topSongs: any[] = await topRes.json()
      if (!topSongs.length) {
        setState(s => ({ ...s, isContributing: false, noTopTracks: true }))
        return
      }
      // 5. Fetch all tracks in owner's spotify smas playlist
      const playlistTracksData = await getPlaylistTracks(session.accessToken, spotifyPlaylistId)

      const existingIds = new Set((playlistTracksData.items || []).map((item: any) => item.track?.id))
      // 6. Deduplicate
      const newTracks = topSongs.filter(song => !existingIds.has(song.id))
      if (!newTracks.length) {
        setState(s => ({ ...s, isContributing: false, allDuplicates: true }))
        return
      }
      // 7. Add tracks to playlist (Spotify API wants URIs)
      const uris = newTracks.map(song => `spotify:track:${song.id}`)
      // Call backend API to add tracks using the playlist owner's access token
      const contributeRes = await fetch('/api/spotify/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId, trackUris: uris })
      })
      if (!contributeRes.ok) {
        const errData = await contributeRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to add tracks to playlist')
      }
      // 8. Record contribution in Firestore
      await addContribution({
        playlistId,
        contributorId: session.user.id,
        contributorName: session.user.name || '',
        contributorEmail: session.user.email || '',
        tracks: newTracks.map(song => ({
          spotifyTrackId: song.id,
          name: song.name,
          artist: song.artist,
          album: song.album,
          imageUrl: song.imageUrl,
        })),
      })
      setState(s => ({ ...s, isContributing: false, isSuccess: true, successTracks: newTracks }))
    } catch (err: any) {
      setState(s => ({ ...s, isContributing: false, error: err.message || 'Something went wrong' }))
    }
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading sharing link..." />
      </div>
    )
  }

  if (!state.isValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-red-700">Link Not Found</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">{state.error || 'This sharing link is invalid or has expired.'}</p>
            <Button onClick={() => window.location.assign('/')} aria-label="Go to home">Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.cooldownDays && state.cooldownDays > 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-700 p-6 relative overflow-hidden">
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-0 opacity-20 pointer-events-none select-none text-center">
            <h1 className='font-bubble'>
            SEND ME A SONG h
          </h1>

          <span className="font-luckiest text-3xl">
  Your text here
</span>
    </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center relative z-10">
          <h3 className="text-xl font-semibold text-yellow-600 mb-4">
            You've Already Contributed to {state.ownerName}'s Playlist
          </h3>

          <p className="text-gray-700 mb-4">
            You can contribute again in {state.cooldownDays} day{state.cooldownDays > 1 ? 's' : ''} (on {state.cooldownUntil}).
          </p>
          <p className="text-gray-700 mb-6">
            Interested in finding music from friends? Sign up now to make your own Send Me a Song playlist!
          </p>
          <button
            onClick={() => window.location.assign('/')}
            className="bg-green-700 text-white font-bold py-2 px-6 rounded-full hover:bg-yellow-400 hover:text-green-900 transition duration-300"
            aria-label="Sign up now"
          >
            Sign up
          </button>
        </div>
      </div>
    )
    
  }

  if (state.noTopTracks) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-700">No Top Songs Found</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">Listen to more music on Spotify to generate your top tracks, then try again!</p>
            
            <Button onClick={() => window.location.assign('/')} aria-label="Go to home">Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.allDuplicates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-700">All Songs Already Added</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">All your top songs are already in this playlist. Try again in a few weeks!</p>

            <Button onClick={() => window.location.assign('/')} aria-label="Go to home">Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.isSuccess && state.successTracks) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-green-700">Success!</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">You&apos;ve just sent your top songs to {state.ownerName} 🎶</p>
            <div className="mb-4">
              {state.successTracks.map((song, i) => (
                <SongItem key={song.id || song.spotifyTrackId || i} song={{
                  id: song.id || song.spotifyTrackId,
                  name: song.name,
                  artist: song.artist,
                  album: song.album,
                  imageUrl: song.imageUrl,
                }} />
              ))}
            </div>
            {/* <Button onClick={() => window.location.assign('/')} aria-label="Go to home" className="mb-2 w-full">Go to Home</Button> */}
            <div className="text-center text-sm text-gray-500 mt-2">
              Want their favorite tracks back in your own playlist? <br /> <span className="font-medium">Create your own SMAS playlist!</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-red-700">Error</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">{state.error}</p>
            <Button onClick={() => window.location.reload()} aria-label="Retry">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-green-700">Send Your Top Songs to {state.ownerName}</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-700">
              You can contribute your top 5 Spotify songs to {state.ownerName}&apos;s SMAS playlist.
            </p>
            

            <Button
              onClick={handleContribute}
              aria-label="Add Your Top Songs"
              className="w-full"
              disabled={state.isContributing}
            >
              {state.isContributing ? <LoadingSpinner size="sm" text="Adding your songs..." /> : 'Add Your Top Songs'}
            </Button>
            <div className="text-center text-sm text-gray-500 mt-4">
              You&apos;ll be asked to log in with Spotify if you haven&apos;t already.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 