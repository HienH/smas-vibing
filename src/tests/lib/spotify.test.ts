/**
 * @fileoverview Unit tests for Spotify API functions.
 *
 * Tests all Spotify API functions with mocked responses.
 */

import {
  spotifyRequest,
  getTopTracks,
  createPlaylist,
  addTracksToPlaylist,
  getPlaylistTracks,
  SpotifyAPIError
} from '@/lib/spotify'
import { mockSpotifyData } from '@/mocks/spotify-api'

// Mock fetch globally
global.fetch = jest.fn()

describe('Spotify API Functions', () => {
  const mockAccessToken = 'mock-access-token'
  const mockUserId = 'user1'
  const mockPlaylistId = 'playlist1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('spotifyRequest', () => {
    it('should make successful API request', async () => {
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true }),
      })) as any

      const result = await spotifyRequest(mockAccessToken, '/test-endpoint')

      expect(fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/test-endpoint',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        })
      )
      expect(result).toEqual({ success: true })
    })

    it('should throw SpotifyAPIError on 401 status', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
        text: () => Promise.resolve(JSON.stringify({ error: { message: 'Unauthorized' } })),
      })

      const error = await spotifyRequest(mockAccessToken, '/test-endpoint').catch(e => e)

      expect(error).toBeInstanceOf(SpotifyAPIError)
      expect(error.status).toBe(401)
      expect(error.code).toBe('TOKEN_EXPIRED')
    })

    it('should throw SpotifyAPIError on other error statuses', async () => {
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: { message: 'Not found' } }),
        text: () => Promise.resolve(JSON.stringify({ error: { message: 'Not found' } })),
      })

      const error = await spotifyRequest(mockAccessToken, '/test-endpoint').catch(e => e)

      expect(error).toBeInstanceOf(SpotifyAPIError)
      expect(error.status).toBe(404)
    })
  })

  describe('getTopTracks', () => {
    it('should fetch top tracks with default parameters', async () => {
      const mockResponse = mockSpotifyData.topTracks
        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })

      const result = await getTopTracks(mockAccessToken)

      expect(fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term',
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse)
    })

    it('should fetch top tracks with custom parameters', async () => {
      const mockResponse = mockSpotifyData.topTracks
        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })

      const result = await getTopTracks(mockAccessToken, 10, 'long_term')

      expect(fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=long_term',
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createPlaylist', () => {
    it('should create playlist successfully', async () => {
      const mockResponse = mockSpotifyData.createdPlaylist
        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })

      const result = await createPlaylist(
        mockAccessToken,
        mockUserId,
        'Test Playlist',
        'Test Description',
        true
      )

      expect(fetch).toHaveBeenCalledWith(
        `https://api.spotify.com/v1/users/${mockUserId}/playlists`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Playlist',
            description: 'Test Description',
            public: true
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should create playlist without adding tracks', async () => {
      const mockResponse = mockSpotifyData.createdPlaylist
        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })

      const result = await createPlaylist(
        mockAccessToken,
        mockUserId,
        'SMAS',
        'A collaborative playlist created with Send Me a Song',
        true
      )

      // Verify that only the playlist creation was called, not track addition
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith(
        `https://api.spotify.com/v1/users/${mockUserId}/playlists`,
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse)
    })

    it('should not create duplicate playlists with same name', async () => {
      const mockResponse = mockSpotifyData.createdPlaylist
        ; (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse),
            text: () => Promise.resolve(JSON.stringify(mockResponse)),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse),
            text: () => Promise.resolve(JSON.stringify(mockResponse)),
          })

      // First creation
      const result1 = await createPlaylist(
        mockAccessToken,
        mockUserId,
        'SMAS',
        'A collaborative playlist created with Send Me a Song',
        true
      )

      // Second creation with same name - should not create duplicate
      const result2 = await createPlaylist(
        mockAccessToken,
        mockUserId,
        'SMAS',
        'A collaborative playlist created with Send Me a Song',
        true
      )

      // Both should return the same playlist data
      expect(result1).toEqual(result2)
      expect(result1.id).toBe(mockResponse.id)
    })
  })

  describe('addTracksToPlaylist', () => {
    it('should add tracks to playlist successfully', async () => {
      const mockResponse = { snapshot_id: 'mock-snapshot-id' }
      const trackUris = ['spotify:track:1', 'spotify:track:2']

        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })

      const result = await addTracksToPlaylist(mockAccessToken, mockPlaylistId, trackUris)

      expect(fetch).toHaveBeenCalledWith(
        `https://api.spotify.com/v1/playlists/${mockPlaylistId}/tracks`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ uris: trackUris })
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getPlaylistTracks', () => {
    it('should fetch playlist tracks successfully', async () => {
      const mockResponse = mockSpotifyData.playlistTracks
        ; (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          text: () => Promise.resolve(JSON.stringify(mockResponse)),
        })

      const result = await getPlaylistTracks(mockAccessToken, mockPlaylistId)

      expect(fetch).toHaveBeenCalledWith(
        `https://api.spotify.com/v1/playlists/${mockPlaylistId}/tracks`,
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse)
    })
  })
}) 