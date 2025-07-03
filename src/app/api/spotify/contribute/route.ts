/**
 * @fileoverview API route to add tracks to a playlist using the owner's access token.
 *
 * Ensures only the playlist owner can add tracks to their playlist, even when a contributor submits songs.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPlaylistById } from '@/services/firebase/playlists'
import { getUserById, getUserBySpotifyUserId, updateUserTokens } from '@/services/firebase/users'
import { addTracksToPlaylist } from '@/lib/spotify'

const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

async function refreshSpotifyAccessToken(refreshToken: string, userId: string) {
  const basicAuth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Failed to refresh token')
  // Update tokens in Firestore
  await updateUserTokens(userId, data.access_token, data.refresh_token || refreshToken, data.expires_in)
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const { playlistId, trackUris } = await req.json()
    if (!playlistId || !Array.isArray(trackUris) || trackUris.length === 0) {
      return NextResponse.json({ error: 'Missing playlistId or trackUris' }, { status: 400 })
    }
    // 1. Get playlist and owner
    const playlistRes = await getPlaylistById(playlistId)
    if (!playlistRes.success || !playlistRes.data) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }
    const playlist = playlistRes.data
    const spotifyUserId = playlist.spotifyUserId

    // 2. Get owner's access token
    const ownerRes = await getUserBySpotifyUserId(spotifyUserId)

    if (!ownerRes.success || !ownerRes.data || !ownerRes.data.spotifyAccessToken) {
      return NextResponse.json({ error: 'Owner access token not found' }, { status: 401 })
    }
    let ownerAccessToken = ownerRes.data.spotifyAccessToken
    // 3. Check if token is expired
    const now = Date.now()
    const expiresAt = ownerRes.data.spotifyTokenExpiresAt?.toMillis?.() || 0
    if (expiresAt && expiresAt < now + 60000) { // refresh if expiring in <1min
      if (!ownerRes.data.spotifyRefreshToken) {
        return NextResponse.json({ error: 'Owner refresh token not found' }, { status: 401 })
      }
      try {
        ownerAccessToken = await refreshSpotifyAccessToken(ownerRes.data.spotifyRefreshToken, spotifyUserId)
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to refresh token' }, { status: 401 })
      }
    }
    // 4. Add tracks to playlist
    try {
      await addTracksToPlaylist(ownerAccessToken, playlist.spotifyPlaylistId, trackUris)
      return NextResponse.json({ success: true })
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Failed to add tracks' }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
} 