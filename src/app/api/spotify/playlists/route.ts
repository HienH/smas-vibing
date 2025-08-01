/**
 * @fileoverview Playlist API route - Creates or retrieves user's SMAS playlist and syncs metadata with Firestore.
 *
 * Handles playlist creation in Spotify and Firestore, and generates sharing links for the SMAS app.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  createPlaylist as createSpotifyPlaylist,
  getPlaylistTracks,
  uploadPlaylistCoverImage,
  SpotifyAPIError
} from '@/lib/spotify'
import { validateApiRequest } from '@/lib/auth'
import { SPOTIFY_CONFIG, APP_CONFIG } from '@/lib/constants'
import type { Playlist as StorePlaylist } from '@/stores/playlist-store'
import { getOrCreatePlaylist, updatePlaylist, getPlaylistsByOwner } from '@/services/firebase/playlists'
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

    // Get user profile to get spotifyUserId - check both users and accounts collections
    const userResult = await getUserByNextAuthId(internalUserId)

    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const spotifyUserId = userResult.data.spotifyUserId

    // 0. Check if user already has any SMAS playlists in Firestore
    const userPlaylistsResult = await getPlaylistsByOwner(spotifyUserId)
    const existingFirestorePlaylists = userPlaylistsResult.success && userPlaylistsResult.data ? userPlaylistsResult.data : []

    // Check if any of the user's Firestore playlists are SMAS playlists
    const existingSmasPlaylist = existingFirestorePlaylists.find(playlist =>
      playlist.name === SPOTIFY_CONFIG.playlistName
    )

    if (existingSmasPlaylist) {
      // Fetch the existing playlist from Spotify
      const existingSpotifyPlaylist = await getPlaylistTracks(accessToken, existingSmasPlaylist.spotifyPlaylistId)

      // Return the existing playlist data
      const playlist: StorePlaylist = {
        id: existingSmasPlaylist.spotifyPlaylistId,
        name: existingSmasPlaylist.name,
        songs: existingSpotifyPlaylist?.items?.map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album?.name || 'Unknown Album',
          imageUrl: item.track.album?.images[0]?.url,
          contributorId: undefined
        })) || [],
        contributors: [],
        shareLink: '', // Will be populated below
        firestoreId: existingSmasPlaylist.id,
      }

      // Generate sharing link for existing playlist
      const existingLinkResult = await getSharingLinkByOwner(spotifyUserId)
      if (existingLinkResult.success && existingLinkResult.data) {
        playlist.shareLink = `${APP_CONFIG.url}/share/${existingLinkResult.data.linkSlug}`
      }

      return NextResponse.json(playlist)
    }


    // 1. Create new SMAS playlist on Spotify
    const smasPlaylist = await createSpotifyPlaylist(
      accessToken,
      spotifyUserId,
      SPOTIFY_CONFIG.playlistName,
      SPOTIFY_CONFIG.playlistDescription,
      true
    )
    smasPlaylist.tracks = { items: [] }

    // 2. Upload the static SMAS cover image
    try {
      console.log(`Uploading SMAS cover image to playlist ${smasPlaylist.id}`)
      await uploadPlaylistCoverImage(accessToken, smasPlaylist.id, smasCoverBase64)
    } catch (err) {
      console.error('Failed to upload SMAS cover image:', err)
    }

    // 3. Create new Firestore playlist record
    const firestoreResult = await getOrCreatePlaylist({
      spotifyPlaylistId: smasPlaylist.id,
      spotifyUserId: spotifyUserId,
      name: smasPlaylist.name,
      description: smasPlaylist.description,
    })

    // 4. If playlist metadata has changed, update Firestore
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

    // 5. Generate or fetch sharing link for this playlist
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

    // 6. Transform to SMAS format (merge Firestore metadata + Spotify tracks)
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
    // console.error('Error creating playlist:', error)
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