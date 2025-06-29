/**
 * @fileoverview Playlist API route - Creates or retrieves user's SMAS playlist.
 *
 * Handles playlist creation in Spotify and generates sharing links for the SMAS app.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import type { Playlist, Song } from '@/stores/playlist-store'

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

/**
 * @description Makes an authenticated request to the Spotify API with automatic token refresh.
 * @param {string} accessToken - The Spotify access token.
 * @param {string} endpoint - The API endpoint to call.
 * @param {RequestInit} options - Request options.
 * @returns {Promise<any>} The API response data.
 */
async function spotifyRequest(accessToken: string, endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    
    // If token expired, throw a specific error
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED')
    }
    
    throw new Error(`Spotify API error: ${response.status} - ${error.error?.message || 'Unknown error'}`)
  }

  return response.json()
}

/**
 * @description Creates or retrieves the user's SMAS playlist.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<NextResponse>} The playlist data or error response.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the JWT token to access the access token
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 })
    }

    // Check if user already has a SMAS playlist
    let userPlaylists
    try {
      userPlaylists = await spotifyRequest(token.accessToken as string, '/me/playlists?limit=50')
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        return NextResponse.json({ error: 'Token expired, please refresh the page' }, { status: 401 })
      }
      throw error
    }

    // Look for existing SMAS playlist
    let smasPlaylist = userPlaylists.items.find((playlist: any) => 
      playlist.name === 'SMAS'
    )

    // If no SMAS playlist exists, create one
    if (!smasPlaylist) {
      try {
        smasPlaylist = await spotifyRequest(token.accessToken as string, `/users/${token.sub}/playlists`, {
          method: 'POST',
          body: JSON.stringify({
            name: 'SMAS',
            description: 'A collaborative playlist created with Send Me a Song - discover music from friends!',
            public: true,
          }),
        })
        
        // Add user's top 5 songs to the playlist
        const topTracksData = await spotifyRequest(token.accessToken as string, '/me/top/tracks?limit=5&time_range=short_term')
        const trackUris = topTracksData.items.map((track: any) => `spotify:track:${track.id}`)
        
        if (trackUris.length > 0) {
          await spotifyRequest(token.accessToken as string, `/playlists/${smasPlaylist.id}/tracks`, {
            method: 'POST',
            body: JSON.stringify({
              uris: trackUris,
            }),
          })
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
          return NextResponse.json({ error: 'Token expired, please refresh the page' }, { status: 401 })
        }
        throw error
      }
    } else {
      // If playlist exists, fetch its current tracks
      try {
        const playlistTracks = await spotifyRequest(token.accessToken as string, `/playlists/${smasPlaylist.id}/tracks`)
        smasPlaylist.tracks = playlistTracks
      } catch (error) {
        if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
          return NextResponse.json({ error: 'Token expired, please refresh the page' }, { status: 401 })
        }
        throw error
      }
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
      shareLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${token.sub}`
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error creating playlist:', error)
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    )
  }
} 