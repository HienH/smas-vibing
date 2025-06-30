/**
 * @fileoverview Spotify API client for making authenticated requests to Spotify Web API.
 *
 * Provides centralized Spotify API functionality with token management and error handling.
 */

import { API_ENDPOINTS } from './constants'

const SPOTIFY_API_BASE = API_ENDPOINTS.spotify.base

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
    
    if (response.status === 401) {
      throw new SpotifyAPIError('TOKEN_EXPIRED', 401, 'TOKEN_EXPIRED')
    }
    
    throw new SpotifyAPIError(
      `Spotify API error: ${response.status} - ${error.error?.message || 'Unknown error'}`,
      response.status,
      error.error?.status
    )
  }

  return response.json()
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