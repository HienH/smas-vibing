/**
 * @fileoverview API route for contributing songs to a playlist.
 *
 * Handles song contribution with cooldown checking and Firestore tracking.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/(auth)/api/auth/[...nextauth]/route'
import { addTracksToPlaylist } from '@/lib/spotify'
import { createContribution, checkUserContribution } from '@/services/firebase/contributions'
import { getUserByNextAuthId } from '@/services/firebase/users'
import { getSharingLinkBySlug, updateSharingLink } from '@/services/firebase/sharing-links'
import admin from 'firebase-admin'
import { getPlaylistById } from '@/services/firebase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playlistId, trackUris, linkSlug } = await request.json()

    if (!playlistId || !trackUris || !Array.isArray(trackUris)) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // // Get user profile
    // const userResult = await getUserByNextAuthId(session.user.id)
    // if (!userResult.success || !userResult.data) {
    //   return NextResponse.json({ error: 'User not found' }, { status: 404 })
    // }

    // Check cooldown
    const cooldownResult = await checkUserContribution(playlistId, session.user.id)
    if (!cooldownResult.success) {
      return NextResponse.json({ error: 'Failed to check cooldown' }, { status: 500 })
    }

    if (cooldownResult.data?.hasContributed) {
      return NextResponse.json({
        error: 'Cooldown active',
        cooldown: cooldownResult.data
      }, { status: 429 })
    }

    // Get access token from session
    const accessToken = (session as any).accessToken
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 })
    }

    // Add tracks to Spotify playlist
    try {
      console.log("adding tracks to spotify playlist")
      const playlistDoc = await getPlaylistById(playlistId);
      const spotifyPlaylistId = playlistDoc.data?.spotifyPlaylistId;
      if (!spotifyPlaylistId) {
        return NextResponse.json({ error: 'No spotify playlist found' }, { status: 401 })
      }
      await addTracksToPlaylist(accessToken, spotifyPlaylistId, trackUris)
    } catch (error) {
      console.error('Failed to add tracks to playlist:', error)
      return NextResponse.json({ error: 'Failed to add tracks to playlist' }, { status: 500 })
    }

    // Record contribution in Firestore
    const contributionResult = await createContribution({
      playlistId,
      contributorId: session.user.id,
      contributorName: session.user.name || '',
      spotifyTrackUris: trackUris,
    })

    if (!contributionResult.success) {
      return NextResponse.json({ error: 'Failed to record contribution' }, { status: 500 })
    }

    // Track link usage if linkSlug provided
    if (linkSlug) {
      const linkResult = await getSharingLinkBySlug(linkSlug)
      if (linkResult.success && linkResult.data) {
        await updateSharingLink(linkResult.data.id, {
          usageCount: (linkResult.data.usageCount || 0) + 1,
          lastUsedAt: admin.firestore.Timestamp.now(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Songs added successfully'
    })

  } catch (error) {
    console.error('Contribution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 