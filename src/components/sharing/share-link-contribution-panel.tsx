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

      const newTracks = topSongs
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
      const contributionResult = await addContribution({
        playlistId,
        contributorId: session.user.id,
        contributorName: session.user.name || '',
        tracks: newTracks.map(song => ({
          spotifyTrackId: song.id,
          name: song.name,
          artist: song.artist,
          album: song.album,
          imageUrl: song.imageUrl,
        })),
      })

      if (!contributionResult.success) {
        throw new Error('Failed to record contribution in database')
      }
      setState(s => ({ ...s, isContributing: false, isSuccess: true, successTracks: newTracks }))
    } catch (err: any) {
      setState(s => ({ ...s, isContributing: false, error: err.message || 'Something went wrong' }))
    }
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center mt-30 bg-green-50">
        <LoadingSpinner size="lg" text="Loading sharing link..." />
      </div>
    )
  }

  if (!state.isValid) {
    return (
      <div className="flex text-center justify-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
          <CardHeader>
            <h2 className="text-xl font-semibold text-red-700">Sorry Link Not Found</h2>
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
      <div className="flex justify-center text-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
          <CardHeader>
            <h2 className="text-xl font-semibold text-yellow-600 mb-4">
              You've Already Contributed to
              <span className='text-gray-800'>  {" "}{state.ownerName}'s
              </span> Playlist
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-gray-700 mb-4">
                You can contribute again in {state.cooldownDays} day{state.cooldownDays > 1 ? 's' : ''} (on {state.cooldownUntil}).
              </p>

              <p className="text-gray-700 mb-6">
                Interested in finding music from friends? Sign up now to make your own Send Me a Song playlist!
              </p>
              <Button
                onClick={() => window.location.assign('/')}
                aria-label="Add Your Top Songs"
                className="w-full"
                disabled={state.isContributing}
              >
                Sign up

              </Button>
              <div className="text-center text-sm text-gray-500 mt-2">
                You&apos;ll be asked to log in with Spotify if you haven&apos;t already.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    )

  }

  if (state.noTopTracks) {
    return (
      <div className="flex text-center justify-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
          <CardHeader>
            <h2 className="text-xl font-semibold text-red-700">No Top Songs Found On Spotify</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">Listen to more music on Spotify to generate your top songs, then try again!</p>

            <Button onClick={() => window.location.assign('/')} aria-label="Go to home">Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.allDuplicates) {
    return (
      <div className="flex text-center justify-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
          <CardHeader>
            <h2 className="text-xl font-semibold">
              <span className='text-green-700'>
                Woo-Hoo! {" "}
              </span>
              All Your Top Songs Are Already Added</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">Your top songs are already in this playlist, try again in a few weeks!</p>

            <Button onClick={() => window.location.assign('/')} aria-label="Go to home">Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.isSuccess && state.successTracks) {
    return (
      <div className="flex text-center justify-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
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
              Want their favorite tracks back in your own playlist? <br />
              <Button onClick={() => window.location.assign('/')} aria-label="Create your own SMAS playlist!" className="mb-2 mt-2 w-3/5">Create your own SMAS playlist!</Button>

            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex text-center justify-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
          <CardHeader>
            <h2 className="text-xl font-semibold text-red-700">Sorry Try Again Later</h2>
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
    <div className="flex text-center justify-center mt-12 bg-green-50">
      <Card className='lg:w-3xl'>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-700 text-center">Send {" "}
            <span className='text-green-700'>{state.ownerName}{" "}
            </span>
            your favourite songs</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-700">
              Click to send your most played spotify songs to {state.ownerName}&apos;s SMAS playlist.
            </p>

            <Button
              onClick={handleContribute}
              aria-label="Add Your Top Songs"
              className="w-full"
              disabled={state.isContributing}
            >
              {state.isContributing ? <LoadingSpinner size="sm" text="Adding your songs..." /> : 'Send songs'}
            </Button>
            <div className="text-center text-sm text-gray-500 mt-2">
              You&apos;ll be asked to log in with Spotify if you haven&apos;t already.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 