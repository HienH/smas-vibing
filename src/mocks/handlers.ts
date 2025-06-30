/**
 * @fileoverview MSW handlers for API mocking in tests.
 *
 * Provides mock handlers for Spotify API and NextAuth endpoints.
 */

import { http, HttpResponse } from 'msw'
import { mockSpotifyData } from './spotify-api'
import { mockAuthData } from './next-auth'

export const handlers = [
  // Spotify API endpoints
  http.get('https://api.spotify.com/v1/me/top/tracks', () => {
    return HttpResponse.json(mockSpotifyData.topTracks)
  }),

  http.get('https://api.spotify.com/v1/me/playlists', () => {
    return HttpResponse.json(mockSpotifyData.playlists)
  }),

  http.post('https://api.spotify.com/v1/users/:userId/playlists', () => {
    return HttpResponse.json(mockSpotifyData.createdPlaylist)
  }),

  http.post('https://api.spotify.com/v1/playlists/:playlistId/tracks', () => {
    return HttpResponse.json({ snapshot_id: 'mock-snapshot-id' })
  }),

  http.get('https://api.spotify.com/v1/playlists/:playlistId/tracks', () => {
    return HttpResponse.json(mockSpotifyData.playlistTracks)
  }),

  // NextAuth endpoints
  http.get('/api/auth/session', () => {
    return HttpResponse.json(mockAuthData.session)
  }),

  http.post('/api/auth/signin', () => {
    return HttpResponse.json({ url: '/api/auth/callback/spotify' })
  }),

  http.get('/api/auth/signout', () => {
    return HttpResponse.json({ url: '/' })
  }),

  // SMAS API endpoints
  http.get('/api/spotify/users/top-songs', () => {
    return HttpResponse.json(mockSpotifyData.topSongs)
  }),

  http.post('/api/spotify/playlists', () => {
    return HttpResponse.json(mockSpotifyData.smasPlaylist)
  }),
] 