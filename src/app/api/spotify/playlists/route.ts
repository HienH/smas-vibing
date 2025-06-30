/**
 * @fileoverview Playlist API route - Creates or retrieves user's SMAS playlist.
 *
 * Handles playlist creation in Spotify and generates sharing links for the SMAS app.
 */
import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserPlaylists, 
  createPlaylist, 
  addTracksToPlaylist, 
  getPlaylistTracks,
  getTopTracks,
  SpotifyAPIError 
} from '@/lib/spotify'
import { validateApiRequest } from '@/lib/auth'
import { SPOTIFY_CONFIG, APP_CONFIG } from '@/lib/constants'
import type { Playlist, Song } from '@/stores/playlist-store'

/**
 * @description Creates or retrieves the user's SMAS playlist.
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

    // Check if user already has a SMAS playlist
    const userPlaylists = await getUserPlaylists(accessToken)
    let smasPlaylist = userPlaylists.items.find((playlist: any) => 
      playlist.name === SPOTIFY_CONFIG.playlistName
    )

    // If no SMAS playlist exists, create one
    if (!smasPlaylist) {
      smasPlaylist = await createPlaylist(
        accessToken,
        userId,
        SPOTIFY_CONFIG.playlistName,
        SPOTIFY_CONFIG.playlistDescription,
        true
      )
      
      // Add user's top 5 songs to the playlist
      const topTracksData = await getTopTracks(accessToken)
      const trackUris = topTracksData.items.map((track: any) => `spotify:track:${track.id}`)
      
      if (trackUris.length > 0) {
        await addTracksToPlaylist(accessToken, smasPlaylist.id, trackUris)
      }
    } else {
      // If playlist exists, fetch its current tracks
      const playlistTracks = await getPlaylistTracks(accessToken, smasPlaylist.id)
      smasPlaylist.tracks = playlistTracks
    }

    // Transform to SMAS format
    const playlist: Playlist = {
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