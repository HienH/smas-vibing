/**
 * @fileoverview Application constants for SMAS.
 *
 * Centralizes all application constants for better maintainability.
 */

export const APP_CONFIG = {
  name: 'Send Me a Song (SMAS)',
  description: 'Discover new music from your friends\' favourite song',
  url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
} as const

export const SPOTIFY_CONFIG = {
  playlistName: 'SMAS',
  playlistDescription: 'A collaborative playlist created with Send Me a Song - discover music from friends!',
  topTracksLimit: 5,
  timeRange: 'short_term' as const,
  scopes: [
    'user-top-read',
    'playlist-modify-public',
    'playlist-read-private',
    'user-read-email',
    'user-library-read',
  ].join(' '),
} as const

export const API_ENDPOINTS = {
  spotify: {
    base: 'https://api.spotify.com/v1',
    token: 'https://accounts.spotify.com/api/token',
  },
} as const 