/**
 * @fileoverview Spotify API client for making authenticated requests to Spotify Web API.
 *
 * Provides centralized Spotify API functionality with token management and error handling.
 */

import { spotifyRateLimiter } from './rate-limiter'
import { API_ENDPOINTS } from './constants'

export class SpotifyAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'SpotifyAPIError'
  }
}

/**
 * @description Makes an authenticated request to the Spotify API.
 * @param {string} accessToken - The Spotify access token.
 * @param {string} endpoint - The API endpoint to call.
 * @param {RequestInit} options - Request options.
 * @returns {Promise<any>} The API response data.
 * @throws {SpotifyAPIError} When the API request fails.
 */
export async function spotifyRequest(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  return spotifyRateLimiter.executeWithRetry(async () => {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {})
      },
    })

    // Update rate limiter state from response headers
    spotifyRateLimiter.updateFromHeaders(response.headers)

    // Special case: image upload returns 202 and no body
    if (endpoint.endsWith('/images')) {
      if (response.status === 202) {
        return // Success, no body to parse
      }
      // If not 202, treat as error
      throw new Error(`Failed to upload playlist cover image. Status: ${response.status}`)
    }

    let data
    try {
      data = JSON.parse(await response.text())
    } catch (e) {
      throw e
    }

    // Usual error handling for other endpoints
    if (response.status === 401) {
      throw new SpotifyAPIError('TOKEN_EXPIRED', 401, 'TOKEN_EXPIRED')
    }

    if (!response.ok) {
      throw new SpotifyAPIError(
        data.error?.message || 'Spotify API error',
        response.status,
        data
      )
    }
    return data
  })
}

/**
 * @description Fetches user's top tracks from Spotify.
 * @param {string} accessToken - The Spotify access token.
 * @param {number} limit - Number of tracks to fetch (default: 5).
 * @param {string} timeRange - Time range for top tracks (default: 'short_term').
 * @returns {Promise<any>} The top tracks data.
 */
export async function getTopTracks(
  accessToken: string,
  limit: number = 5,
  timeRange: string = 'short_term'
): Promise<any> {
  return spotifyRequest(
    accessToken,
    `/me/top/tracks?limit=${limit}&time_range=${timeRange}`
  )
}

/**
 * @description Fetches user's playlists from Spotify.
 * @param {string} accessToken - The Spotify access token.
 * @param {number} limit - Number of playlists to fetch (default: 50).
 * @returns {Promise<any>} The user's playlists.
 */
export async function getUserPlaylists(
  accessToken: string,
  limit: number = 50
): Promise<any> {
  return spotifyRequest(
    accessToken,
    `/me/playlists?limit=${limit}`
  )
}

/**
 * @description Creates a new playlist for a user.
 * @param {string} accessToken - The Spotify access token.
 * @param {string} userId - The user's Spotify ID.
 * @param {string} name - The playlist name.
 * @param {string} description - The playlist description.
 * @param {boolean} isPublic - Whether the playlist is public.
 * @returns {Promise<any>} The created playlist data.
 */
export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description: string,
  isPublic: boolean = true
): Promise<any> {
  return spotifyRequest(
    accessToken,
    `/users/${userId}/playlists`,
    {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    }
  )
}

/**
 * @description Adds tracks to a playlist.
 * @param {string} accessToken - The Spotify access token.
 * @param {string} playlistId - The playlist ID.
 * @param {string[]} trackUris - Array of track URIs to add.
 * @returns {Promise<any>} The response from Spotify.
 */
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<any> {

  console.log(trackUris)

  return spotifyRequest(
    accessToken,
    `/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      body: JSON.stringify({ uris: trackUris }),
    }
  )
}

/**
 * @description Fetches tracks from a playlist.
 * @param {string} accessToken - The Spotify access token.
 * @param {string} playlistId - The playlist ID.
 * @returns {Promise<any>} The playlist tracks data.
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<any> {
  return spotifyRequest(
    accessToken,
    `/playlists/${playlistId}/tracks`
  )
}

/**
 * @description Uploads a custom cover image to a Spotify playlist.
 * @param {string} accessToken - The Spotify access token.
 * @param {string} playlistId - The playlist ID.
 * @param {string} base64Image - The base64-encoded JPEG image string (no data URI prefix).
 * @returns {Promise<void>} Resolves on success.
 * @see https://developer.spotify.com/documentation/web-api/reference/upload-custom-playlist-cover
 */
export async function uploadPlaylistCoverImage(
  accessToken: string,
  playlistId: string,
  base64Image: string
): Promise<void> {
  await spotifyRequest(
    accessToken,
    `/playlists/${playlistId}/images`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: base64Image,
    }
  )
}

/**
 * @description Refreshes the Spotify access token using the refresh token.
 * @param {string} refreshToken - The refresh token to use.
 * @returns {Promise<any>} The refreshed token data or error.
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(API_ENDPOINTS.spotify.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    const tokens = await response.json()

    if (!response.ok) {
      console.error('❌ Spotify token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error: tokens.error,
        errorDescription: tokens.error_description
      })
      throw tokens
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? refreshToken,
      accessTokenExpires: Date.now() + tokens.expires_in * 1000,
    }
  } catch (error) {
    console.error('💥 Token refresh error:', error)
    return {
      error: 'RefreshAccessTokenError',
    }
  }
} 