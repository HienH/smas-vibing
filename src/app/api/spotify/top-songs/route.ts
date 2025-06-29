/**
 * @fileoverview Top songs API route - Fetches user's top 5 songs from Spotify.
 *
 * Uses Spotify Web API to get user's top tracks and formats them for the SMAS app.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import type { Song } from '@/stores/playlist-store'

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
 * @description Fetches user's top 5 songs from Spotify API.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<NextResponse>} The top songs data or error response.
 */
export async function GET(request: NextRequest) {
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

    // Fetch top tracks from Spotify API using the access token
    let topTracksData
    try {
      topTracksData = await spotifyRequest(token.accessToken as string, '/me/top/tracks?limit=5&time_range=short_term')
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        return NextResponse.json({ error: 'Token expired, please refresh the page' }, { status: 401 })
      }
      throw error
    }
    
    // Transform Spotify data to SMAS format
    const songs: Song[] = topTracksData.items.map((track: any, index: number) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      imageUrl: track.album?.images[0]?.url,
      contributorId: undefined // User's own songs don't have contributor
    }))

    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error fetching top songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top songs' },
      { status: 500 }
    )
  }
} 