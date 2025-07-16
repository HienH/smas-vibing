/**
 * @fileoverview Top songs API route - Fetches user's top 5 songs from Spotify.
 *
 * Uses Spotify Web API to get user's top tracks and formats them for the SMAS app.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTopTracks, SpotifyAPIError } from '@/lib/spotify'
import { validateApiRequest } from '@/lib/auth'
import type { Song } from '@/stores/playlist-store'

/**
 * @description Fetches user's top 5 songs from Spotify API.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<NextResponse>} The top songs data or error response.
 */
export async function GET(request: NextRequest) {
  try {
    const authData = await validateApiRequest(request)

    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accessToken } = authData

    // Fetch top tracks from Spotify API
    const topTracksData = await getTopTracks(accessToken)
    // Transform Spotify data to SMAS format
    const songs: Song[] = topTracksData.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      imageUrl: track.album?.images[0]?.url,
      contributorId: undefined // User's own songs don't have contributor
    }))

    return NextResponse.json(songs)
  } catch (error) {
    if (error instanceof SpotifyAPIError && error.code === 'TOKEN_EXPIRED') {
      return NextResponse.json(
        { error: 'Token expired, please refresh the page' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch top songs' },
      { status: 500 }
    )
  }
} 