/**
 * @fileoverview Contribution panel for sharing link - handles friend contribution flow UI and logic.
 *
 * Uses TanStack Query for data fetching and provides comprehensive error handling and loading states.
 */
'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent, Button, LoadingState, useToast, LoadingButton } from '@/components/ui'
import { SongItem } from '@/components/playlist/song-item'
import { useTopSongs, useContributeSongs, useSharingLink } from '@/hooks/use-spotify-queries'
import { useFirebase } from '@/hooks/use-firebase'
import type { Song } from '@/stores/playlist-store'

interface ShareLinkContributionPanelProps {
  linkSlug: string
  session: any // TODO: Replace with proper session type
}

/**
 * @description Handles the friend contribution flow for a sharing link.
 * @param {ShareLinkContributionPanelProps} props
 */
export function ShareLinkContributionPanel({
  linkSlug,
  session,
}: ShareLinkContributionPanelProps) {
  const { addToast } = useToast()
  const { checkContribution, addContribution: addContributionToFirebase, trackLinkUsage } = useFirebase()

  // TanStack Query hooks
  const { data: topSongs, isLoading: isLoadingTopSongs } = useTopSongs()
  const { mutate: contributeSongs, isPending: isContributing } = useContributeSongs()
  const { data: sharingLink, isLoading: isLoadingLink, error: linkError } = useSharingLink(linkSlug)

  const [state, setState] = useState({
    isValid: false,
    ownerName: undefined as string | undefined,
    error: undefined as string | undefined,
    isSuccess: false,
    successTracks: undefined as Song[] | undefined,
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

  // Update state when sharing link data changes
  useEffect(() => {
    if (sharingLink && sharingLink.isActive) {
      setState(s => ({
        ...s,
        isValid: true,
        ownerName: sharingLink.ownerName
      }))
      trackLinkUsage(sharingLink.id)
    } else if (sharingLink && !sharingLink.isActive) {
      setState(s => ({
        ...s,
        isValid: false,
        error: 'Invalid or expired sharing link.'
      }))
    }
  }, [sharingLink, trackLinkUsage])

  // Handle link error
  useEffect(() => {
    if (linkError) {
      setState(s => ({
        ...s,
        isValid: false,
        error: 'Failed to load sharing link.'
      }))
    }
  }, [linkError])

  const handleContribute = async () => {
    if (!session) {
      if (typeof window !== 'undefined') {
        const { signIn } = await import('next-auth/react')
        signIn('spotify')
      }
      return
    }

    if (!sharingLink || !topSongs) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Unable to contribute at this time. Please try again.'
      })
      return
    }

    try {
      // Check cooldown
      const cooldownResult = await checkContribution(sharingLink.playlistId, session.user.id)
      if (!cooldownResult.success) {
        throw new Error('Failed to check contribution')
      }

      if (cooldownResult.data?.hasContributed && cooldownResult.data.contribution) {
        // Calculate days left
        const expiresAt = cooldownResult.data.contribution.expiresAt.toDate()
        const now = new Date()
        const days = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        setState(s => ({
          ...s,
          cooldownDays: days,
          cooldownUntil: formatDate(expiresAt.toISOString())
        }))
        return
      }

      if (!topSongs.length) {
        setState(s => ({ ...s, noTopTracks: true }))
        return
      }

      // Prepare tracks for contribution
      const trackUris = topSongs.map(song => `spotify:track:${song.id}`)

      // Contribute songs using TanStack Query mutation
      contributeSongs(
        { playlistId: sharingLink.playlistId, trackUris },
        {
          onSuccess: async () => {
            // Record contribution in Firestore
            const contributionResult = await addContributionToFirebase({
              playlistId: sharingLink.playlistId,
              contributorId: session.user.id,
              contributorName: session.user.name || '',
              tracks: topSongs.map(song => ({
                spotifyTrackId: song.id,
                name: song.name,
                artist: song.artist,
                album: song.album,
                imageUrl: song.imageUrl,
              })),
            })

            if (contributionResult.success) {
              setState(s => ({
                ...s,
                isSuccess: true,
                successTracks: topSongs
              }))
              addToast({
                type: 'success',
                title: 'Songs Added!',
                message: `Your top songs have been added to ${state.ownerName}'s playlist.`
              })
            }
          },
          onError: (error) => {
            addToast({
              type: 'error',
              title: 'Contribution Failed',
              message: error instanceof Error ? error.message : 'Failed to add songs to playlist'
            })
          }
        }
      )
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Something went wrong'
      })
    }
  }

  const isLoading = isLoadingLink || isLoadingTopSongs

  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-30 bg-green-50">
        <LoadingState isLoading={true} text="Loading sharing link..." size="lg" />
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
              You&apos;ve Already Contributed to
              <span className='text-gray-800'>  {" "}{state.ownerName}&apos;s
              </span> Playlist
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-gray-700 mb-4">
                You can contribute again in {state.cooldownDays} day{state.cooldownDays > 1 ? 's' : ''} (on {state.cooldownUntil}).
              </p>
              <Button onClick={() => window.location.assign('/')} aria-label="Go to home">Go to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.noTopTracks) {
    return (
      <div className="flex justify-center text-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
          <CardHeader>
            <h2 className="text-xl font-semibold text-yellow-600 mb-4">No Top Songs Found</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-gray-700 mb-4">
                You need to listen to more music on Spotify to generate your top tracks.
              </p>
              <Button onClick={() => window.location.assign('/')} aria-label="Go to home">Go to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state.isSuccess) {
    return (
      <div className="flex justify-center text-center mt-12 bg-green-50">
        <Card className='lg:w-3xl'>
          <CardHeader>
            <h2 className="text-xl font-semibold text-green-700 mb-4">
              Success! Your Songs Have Been Added
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-gray-700 mb-4">
                You&apos;ve just sent your top songs to {state.ownerName}&apos;s playlist! 🎶
              </p>

              {state.successTracks && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800">Songs Added:</h3>
                  {state.successTracks.map((song: Song) => (
                    <SongItem key={song.id} song={song} />
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-gray-600">
                  Want their favorite tracks back in your own playlist?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => window.location.assign('/')} aria-label="Create your own playlist">
                    Create Your Own SMAS
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center text-center mt-12 bg-green-50">
      <Card className='lg:w-3xl'>


        <CardContent>
          <div className="space-y-6">
            {!session &&
              <>
                <h2 className="text-xl  text-gray-800 mb-4">
                  <span className='font-semibold'>{state.ownerName} </span> wants to know your favorite songs!
                </h2>
                <p>
                  Send me a song allows you to send your most played spotify song to
                  <span className='font-semibold'>
                    {" "}{state.ownerName} {" "}
                  </span>SMAS playlist. Simply sign in with spotify and we'd do the rest.</p>
              </>
            }

            {topSongs && topSongs.length > 0 && (
              <div className="space-y-3">


                <h3 className="text-xl font-semibold text-gray-800">Your Spotify Top Songs:</h3>
                {topSongs.map((song: Song, index: number) => (
                  <div key={song.id} className="flex items-center space-x-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-medium"
                      aria-label={`Rank ${index + 1}`}
                    >
                      {index + 1}
                    </span>
                    <SongItem song={song} />
                  </div>
                ))}
              </div>
            )}

            <LoadingButton
              onClick={handleContribute}
              isLoading={isContributing}
              loadingText="Adding Songs..."
              className="w-full bg-green-700 p-3 rounded-md text-white mb-2 hover:cursor-pointer"
              aria-label="Add your top songs to playlist"
            >
              {session ? `Send ${state.ownerName} Your Top Songs` : 'Find your top songs'}
            </LoadingButton>
            <p className="text-gray-700 mb-4">
              Discover new music through your friends
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 