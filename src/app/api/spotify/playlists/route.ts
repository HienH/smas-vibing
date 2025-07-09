/**
 * @fileoverview Playlist API route - Creates or retrieves user's SMAS playlist and syncs metadata with Firestore.
 *
 * Handles playlist creation in Spotify and Firestore, and generates sharing links for the SMAS app.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  getUserPlaylists,
  createPlaylist as createSpotifyPlaylist,
  getPlaylistTracks,
  uploadPlaylistCoverImage,
  SpotifyAPIError
} from '@/lib/spotify'
import { validateApiRequest } from '@/lib/auth'
import { SPOTIFY_CONFIG, APP_CONFIG } from '@/lib/constants'
import type { Playlist as StorePlaylist } from '@/stores/playlist-store'
import { getOrCreatePlaylist, updatePlaylist } from '@/services/firebase/playlists'
import smasCoverBase64 from '@/public/smas-cover-base64'
import { createSharingLink, generateUniqueLinkSlug, getSharingLinkByOwner, updateSharingLink } from '@/services/firebase/sharing-links'
import { getUserByNextAuthId } from '@/services/firebase/users'

/**
 * @description Creates or retrieves the user's SMAS playlist and syncs with Firestore.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<NextResponse>} The playlist data or error response.
 */
export async function POST(request: NextRequest) {
  try {
    const authData = await validateApiRequest(request)
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { accessToken, session } = authData
    const internalUserId = session.user.id

    console.log('🔍 POST /api/spotify/playlists: Processing request for user:', internalUserId)

    // Get user profile to get spotifyUserId - check both users and accounts collections
    const userResult = await getUserByNextAuthId(internalUserId)
    if (!userResult.success || !userResult.data) {
      console.error('🔍 POST /api/spotify/playlists: User not found:', userResult.error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const spotifyUserId = userResult.data.spotifyUserId

    console.log('🔍 POST /api/spotify/playlists: Found user with spotifyUserId:', spotifyUserId)

    // 1. Check if user already has a SMAS playlist on Spotify
    const userPlaylists = await getUserPlaylists(accessToken)
    let smasPlaylist = userPlaylists.items.find((playlist: any) =>
      playlist.name === SPOTIFY_CONFIG.playlistName
    )

    let isNewlyCreated = false
    // 2. If no SMAS playlist exists, create one on Spotify
    if (!smasPlaylist) {
      smasPlaylist = await createSpotifyPlaylist(
        accessToken,
        spotifyUserId,
        SPOTIFY_CONFIG.playlistName,
        SPOTIFY_CONFIG.playlistDescription,
        true
      )
      smasPlaylist.tracks = { items: [] }
      isNewlyCreated = true
    } else {
      // If playlist exists, fetch its current tracks
      const playlistTracks = await getPlaylistTracks(accessToken, smasPlaylist.id)
      smasPlaylist.tracks = playlistTracks
    }

    // 3. If newly created, upload the static SMAS cover image
    if (isNewlyCreated) {
      try {

        await uploadPlaylistCoverImage(accessToken, smasPlaylist.id, smasCoverBase64)
      } catch (err) {
        console.error('Failed to upload SMAS cover image:', err)
      }
    }

    // 4. Upsert playlist metadata in Firestore
    const firestoreResult = await getOrCreatePlaylist({
      spotifyPlaylistId: smasPlaylist.id,
      spotifyUserId: spotifyUserId,
      name: smasPlaylist.name,
      description: smasPlaylist.description,
    })

    // 5. If playlist metadata has changed, update Firestore
    if (
      firestoreResult.success &&
      firestoreResult.data &&
      (firestoreResult.data.name !== smasPlaylist.name ||
        firestoreResult.data.description !== smasPlaylist.description)
    ) {
      await updatePlaylist(firestoreResult.data.id, {
        name: smasPlaylist.name,
        description: smasPlaylist.description,
      })
    }

    // 6. Generate or fetch sharing link for this playlist
    let shareLink = ''
    if (firestoreResult.success && firestoreResult.data) {
      // Check if user already has an existing sharing link
      const existingLinkResult = await getSharingLinkByOwner(spotifyUserId)

      if (existingLinkResult.success && existingLinkResult.data) {
        // User already has a sharing link, update it to point to the new playlist if needed
        if (existingLinkResult.data.playlistId !== firestoreResult.data.id) {
          await updateSharingLink(existingLinkResult.data.id, {
            playlistId: firestoreResult.data.id,
            ownerName: session.user.name || 'User',
          })
        }
        shareLink = `${APP_CONFIG.url}/share/${existingLinkResult.data.linkSlug}`
      } else {
        // User doesn't have a sharing link, create a new one
        const slugResult = await generateUniqueLinkSlug()
        if (slugResult.success && typeof slugResult.data === 'string') {
          const linkResult = await createSharingLink({
            playlistId: firestoreResult.data.id,
            spotifyUserId: spotifyUserId,
            ownerName: session.user.name || 'User',
            linkSlug: slugResult.data,
          })
          if (linkResult.success && linkResult.data) {
            shareLink = `${APP_CONFIG.url}/share/${linkResult.data.linkSlug}`
          }
        }
      }
    }

    // 7. Transform to SMAS format (merge Firestore metadata + Spotify tracks)
    const playlist: StorePlaylist = {
      id: smasPlaylist.id,
      name: smasPlaylist.name,
      songs: smasPlaylist.tracks?.items?.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists[0]?.name || 'Unknown Artist',
        album: item.track.album?.name || 'Unknown Album',
        imageUrl: item.track.album?.images[0]?.url,
        contributorId: undefined // Will be updated when contributors are added
      })) || [],
      contributors: [],
      shareLink,
      firestoreId: firestoreResult.success && firestoreResult.data ? firestoreResult.data.id : undefined,
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error creating playlist:', error)
    if (error instanceof SpotifyAPIError && error.code === 'TOKEN_EXPIRED') {
      return NextResponse.json(
        { error: 'Token expired, please refresh the page' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    )
  }
} 