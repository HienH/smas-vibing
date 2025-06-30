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
import type { Playlist as StorePlaylist, Song } from '@/stores/playlist-store'
import { getOrCreatePlaylist, updatePlaylist } from '@/services/firebase/playlists'
import smasCoverBase64 from '@/public/smas-cover-base64'

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
    const userId = session.user.id

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
        userId,
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
      ownerId: userId,
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
      shareLink: `${APP_CONFIG.url}/share/${userId}`
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