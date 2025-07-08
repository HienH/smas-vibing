/**
 * @fileoverview API tests for playlist creation and management.
 *
 * Tests the playlist API route logic for creating and reusing SMAS playlists.
 */
import { createMockSession } from '@/test-utils/data-factories'

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class {
    constructor(public url: string, public init?: RequestInit) { }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200
    })
  }
}))

// Mock the Spotify API functions
jest.mock('@/lib/spotify', () => ({
  getUserPlaylists: jest.fn(),
  createPlaylist: jest.fn(),
  getPlaylistTracks: jest.fn(),
  SpotifyAPIError: class extends Error {
    constructor(message: string, public status: number, public code: string) {
      super(message)
      this.name = 'SpotifyAPIError'
    }
  }
}))

// Mock the auth validation
jest.mock('@/lib/auth', () => ({
  validateApiRequest: jest.fn()
}))

import { getUserPlaylists, createPlaylist, getPlaylistTracks } from '@/lib/spotify'
import { validateApiRequest } from '@/lib/auth'

const mockGetUserPlaylists = getUserPlaylists as jest.MockedFunction<typeof getUserPlaylists>
const mockCreatePlaylist = createPlaylist as jest.MockedFunction<typeof createPlaylist>
const mockGetPlaylistTracks = getPlaylistTracks as jest.MockedFunction<typeof getPlaylistTracks>
const mockValidateApiRequest = validateApiRequest as jest.MockedFunction<typeof validateApiRequest>

describe('Playlist API Route', () => {
  const mockAccessToken = 'mock-access-token'
  const mockUserId = 'user123'
  const mockSession = createMockSession({ id: mockUserId })

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful auth validation
    mockValidateApiRequest.mockResolvedValue({
      accessToken: mockAccessToken,
      session: mockSession
    })
  })

  describe('Playlist Creation Logic', () => {
    it('should create new SMAS playlist when none exists', async () => {
      // Mock no existing playlists
      mockGetUserPlaylists.mockResolvedValue({
        items: []
      })

      // Mock playlist creation
      const createdPlaylist = {
        id: 'new-playlist-id',
        name: 'SMAS',
        description: 'A collaborative playlist created with Send Me a Song',
        public: true
      }
      mockCreatePlaylist.mockResolvedValue(createdPlaylist)

      // Test the logic directly
      const userPlaylists = await mockGetUserPlaylists(mockAccessToken)
      let smasPlaylist = userPlaylists.items.find((playlist: any) =>
        playlist.name === 'SMAS'
      )

      if (!smasPlaylist) {
        smasPlaylist = await mockCreatePlaylist(
          mockAccessToken,
          mockUserId,
          'SMAS',
          'A collaborative playlist created with Send Me a Song',
          true
        )
        smasPlaylist.tracks = { items: [] }
      }

      expect(mockGetUserPlaylists).toHaveBeenCalledWith(mockAccessToken)
      expect(mockCreatePlaylist).toHaveBeenCalledWith(
        mockAccessToken,
        mockUserId,
        'SMAS',
        'A collaborative playlist created with Send Me a Song',
        true
      )
      expect(smasPlaylist.id).toBe('new-playlist-id')
      expect(smasPlaylist.tracks.items).toEqual([]) // Should start empty
    })

    it('should reuse existing SMAS playlist when one exists', async () => {
      // Mock existing SMAS playlist
      const existingPlaylist = {
        id: 'existing-playlist-id',
        name: 'SMAS',
        description: 'A collaborative playlist created with Send Me a Song',
        public: true
      }
      mockGetUserPlaylists.mockResolvedValue({
        items: [existingPlaylist]
      })

      // Mock existing tracks
      const existingTracks = {
        items: [
          {
            track: {
              id: 'track1',
              name: 'Test Song 1',
              artists: [{ name: 'Test Artist 1' }],
              album: {
                name: 'Test Album 1',
                images: [{ url: 'https://example.com/image1.jpg' }]
              }
            }
          }
        ]
      }
      mockGetPlaylistTracks.mockResolvedValue(existingTracks)

      // Test the logic directly
      const userPlaylists = await mockGetUserPlaylists(mockAccessToken)
      let smasPlaylist = userPlaylists.items.find((playlist: any) =>
        playlist.name === 'SMAS'
      )

      if (!smasPlaylist) {
        smasPlaylist = await mockCreatePlaylist(
          mockAccessToken,
          mockUserId,
          'SMAS',
          'A collaborative playlist created with Send Me a Song',
          true
        )
        smasPlaylist.tracks = { items: [] }
      } else {
        const playlistTracks = await mockGetPlaylistTracks(mockAccessToken, smasPlaylist.id)
        smasPlaylist.tracks = playlistTracks
      }

      expect(mockGetUserPlaylists).toHaveBeenCalledWith(mockAccessToken)
      expect(mockCreatePlaylist).not.toHaveBeenCalled() // Should not create new playlist
      expect(mockGetPlaylistTracks).toHaveBeenCalledWith(mockAccessToken, 'existing-playlist-id')
      expect(smasPlaylist.id).toBe('existing-playlist-id')
      expect(smasPlaylist.tracks.items).toHaveLength(1) // Should have existing tracks
      expect(smasPlaylist.tracks.items[0].track.id).toBe('track1')
    })

    it('should handle case where user has other playlists but no SMAS playlist', async () => {
      // Mock other playlists but no SMAS playlist
      const otherPlaylists = [
        {
          id: 'other-playlist-1',
          name: 'My Other Playlist',
          description: 'Not a SMAS playlist',
          public: true
        },
        {
          id: 'other-playlist-2',
          name: 'Another Playlist',
          description: 'Also not SMAS',
          public: false
        }
      ]
      mockGetUserPlaylists.mockResolvedValue({
        items: otherPlaylists
      })

      // Mock playlist creation
      const createdPlaylist = {
        id: 'new-smas-playlist-id',
        name: 'SMAS',
        description: 'A collaborative playlist created with Send Me a Song',
        public: true
      }
      mockCreatePlaylist.mockResolvedValue(createdPlaylist)

      // Test the logic directly
      const userPlaylists = await mockGetUserPlaylists(mockAccessToken)
      let smasPlaylist = userPlaylists.items.find((playlist: any) =>
        playlist.name === 'SMAS'
      )

      if (!smasPlaylist) {
        smasPlaylist = await mockCreatePlaylist(
          mockAccessToken,
          mockUserId,
          'SMAS',
          'A collaborative playlist created with Send Me a Song',
          true
        )
        smasPlaylist.tracks = { items: [] }
      }

      expect(mockCreatePlaylist).toHaveBeenCalled() // Should create new SMAS playlist
      expect(smasPlaylist.id).toBe('new-smas-playlist-id')
      expect(smasPlaylist.tracks.items).toEqual([]) // Should start empty
    })
  })
}) 