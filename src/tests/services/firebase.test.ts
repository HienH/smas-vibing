/**
 * @fileoverview Firebase services tests - Unit tests for Firebase service functions.
 * 
 * Tests user, playlist, contribution, and sharing link service functions.
 */

import { 
  createUser,
  getUserById,
  updateUser,
  createPlaylist,
  getPlaylistById,
  createContribution,
  getContributionById,
  createSharingLink,
  getSharingLinkById,
} from '@/services/firebase'
import { Timestamp } from 'firebase/firestore'

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

describe('Firebase Services', () => {
  const mockUserId = 'test-user-id'
  const mockPlaylistId = 'test-playlist-id'
  const mockContributionId = 'test-contribution-id'
  const mockLinkId = 'test-link-id'

  describe('User Services', () => {
    const mockUserData = {
      id: mockUserId,
      displayName: 'Test User',
      email: 'test@example.com',
      imageUrl: 'https://example.com/image.jpg',
      spotifyAccessToken: 'test-access-token',
      spotifyRefreshToken: 'test-refresh-token',
      spotifyTokenExpiresAt: Timestamp.now(),
    }

    it('should create a user successfully', async () => {
      const result = await createUser(mockUserData)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should get user by ID successfully', async () => {
      const result = await getUserById(mockUserId)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should update user successfully', async () => {
      const updateData = {
        displayName: 'Updated User',
        email: 'updated@example.com',
      }
      const result = await updateUser(mockUserId, updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('Playlist Services', () => {
    const mockPlaylistData = {
      spotifyPlaylistId: 'spotify-playlist-id',
      ownerId: mockUserId,
      name: 'Test Playlist',
      description: 'Test playlist description',
      imageUrl: 'https://example.com/playlist.jpg',
    }

    it('should create a playlist successfully', async () => {
      const result = await createPlaylist(mockPlaylistData)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should get playlist by ID successfully', async () => {
      const result = await getPlaylistById(mockPlaylistId)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('Contribution Services', () => {
    const mockContributionData = {
      playlistId: mockPlaylistId,
      contributorId: mockUserId,
      contributorName: 'Test Contributor',
      contributorEmail: 'contributor@example.com',
      tracks: [
        {
          spotifyTrackId: 'track-1',
          name: 'Test Track 1',
          artist: 'Test Artist 1',
          album: 'Test Album 1',
          imageUrl: 'https://example.com/track1.jpg',
          duration: 180,
        },
      ],
    }

    it('should create a contribution successfully', async () => {
      const result = await createContribution(mockContributionData)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should get contribution by ID successfully', async () => {
      const result = await getContributionById(mockContributionId)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('Sharing Link Services', () => {
    const mockLinkData = {
      playlistId: mockPlaylistId,
      ownerId: mockUserId,
      ownerName: 'Test Owner',
      linkSlug: 'test-slug',
    }

    it('should create a sharing link successfully', async () => {
      const result = await createSharingLink(mockLinkData)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should get sharing link by ID successfully', async () => {
      const result = await getSharingLinkById(mockLinkId)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })
}) 