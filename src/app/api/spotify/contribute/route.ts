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
import { getSharingLinkBySlug, updateSharingLink } from '@/services/firebase/sharing-links'
import { getPlaylistById } from '@/services/firebase'
import { adminDb as db } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'
import { refreshAccessToken } from '@/lib/spotify'

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

    // Get playlist to find the owner
    const playlistDoc = await getPlaylistById(playlistId);
    if (!playlistDoc.data?.spotifyPlaylistId) {
      return NextResponse.json({ error: 'No spotify playlist found' }, { status: 401 })
    }

    // Get playlist owner's access token from accounts collection
    const spotifyUserId = playlistDoc.data.spotifyUserId;
    if (!spotifyUserId) {
      return NextResponse.json({ error: 'Playlist owner not found' }, { status: 404 })
    }

    const accountsRef = db.collection('accounts');
    const accountQuery = await accountsRef
      .where('providerAccountId', '==', spotifyUserId)
      .where('provider', '==', 'spotify')
      .limit(1)
      .get();

    if (accountQuery.empty) {
      return NextResponse.json({ error: 'Playlist owner account not found' }, { status: 404 })
    }

    const ownerAccount = accountQuery.docs[0].data();
    let ownerAccessToken = ownerAccount.access_token;

    if (!ownerAccessToken) {
      return NextResponse.json({ error: 'Playlist owner access token not available' }, { status: 401 })
    }

    // Check if access token is expired and refresh if needed
    const expiresAt = ownerAccount.expires_at;
    if (expiresAt && Date.now() >= expiresAt * 1000) {
      try {
        const refreshed = await refreshAccessToken(ownerAccount.refresh_token);
        if ('error' in refreshed) {
          return NextResponse.json({ error: 'Failed to refresh owner access token' }, { status: 401 })
        }

        // Update the account document with new tokens
        const accountDocRef = accountQuery.docs[0].ref;
        await accountDocRef.update({
          access_token: refreshed.accessToken,
          refresh_token: refreshed.refreshToken,
          expires_at: Math.floor(refreshed.accessTokenExpires / 1000), // Convert to seconds
        });

        ownerAccessToken = refreshed.accessToken;
      } catch (error) {
        console.error('Failed to refresh access token:', error);
        return NextResponse.json({ error: 'Failed to refresh owner access token' }, { status: 401 })
      }
    }

    // Add tracks to Spotify playlist using owner's access token
    try {
      await addTracksToPlaylist(ownerAccessToken, playlistDoc.data.spotifyPlaylistId, trackUris)
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