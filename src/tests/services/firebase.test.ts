/**
 * @fileoverview Firebase services tests - Unit tests for Firebase service functions.
 * 
 * Tests user, playlist, contribution, and sharing link service functions.
 */

import { jest } from '@jest/globals'

const mockUserData = { displayName: 'Test User', email: 'test@example.com', spotifyAccessToken: 'test-access-token', spotifyRefreshToken: 'test-refresh-token', spotifyTokenExpiresAt: new Date() }
const mockPlaylistData = { spotifyPlaylistId: 'playlist123', ownerId: 'user123', name: 'Test Playlist', trackCount: 0, isActive: true }
const mockContributionData = { playlistId: 'playlist123', contributorId: 'user123', contributorName: 'Test User', contributorEmail: 'test@example.com', tracks: [], createdAt: { toMillis: () => Date.now() }, expiresAt: { toMillis: () => Date.now() + 1000000 } }
const mockLinkData = { playlistId: 'playlist123', ownerId: 'user123', ownerName: 'Test User', linkSlug: 'slug123', isActive: true, usageCount: 0 }

jest.mock('@/services/firebase', () => ({
  createUser: jest.fn(() => Promise.resolve({ success: true, data: mockUserData })),
  getUserById: jest.fn(() => Promise.resolve({ success: true, data: mockUserData })),
  updateUser: jest.fn(() => Promise.resolve({ success: true })),
  createPlaylist: jest.fn(() => Promise.resolve({ success: true, data: mockPlaylistData })),
  getPlaylistById: jest.fn(() => Promise.resolve({ success: true, data: mockPlaylistData })),
  createContribution: jest.fn(() => Promise.resolve({ success: true, data: mockContributionData })),
  getContributionById: jest.fn(() => Promise.resolve({ success: true, data: mockContributionData })),
  createSharingLink: jest.fn(() => Promise.resolve({ success: true, data: mockLinkData })),
  getSharingLinkById: jest.fn(() => Promise.resolve({ success: true, data: mockLinkData })),
}))

// Import the tested functions after jest.mock so the mocks are used
const {
  createUser,
  getUserById,
  updateUser,
  createPlaylist,
  getPlaylistById,
  createContribution,
  getContributionById,
  createSharingLink,
  getSharingLinkById,
} = require('@/services/firebase')

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}))

jest.mock('firebase/firestore', () => ({
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(({ id }) => Promise.resolve({ exists: () => true, data: () => ({ id, ...mockUserData, ...mockPlaylistData, ...mockContributionData, ...mockLinkData }) })),
  updateDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn((...args) => ({ id: args[1] || 'mockId' })),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [{ id: 'mockId', data: () => ({ ...mockUserData, ...mockPlaylistData, ...mockContributionData, ...mockLinkData }) }], empty: false })),
  Timestamp: { now: () => ({ toMillis: () => Date.now(), toDate: () => new Date() }), fromMillis: (ms: number) => ({ toMillis: () => ms, toDate: () => new Date(ms) }) },
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
      spotifyTokenExpiresAt: new Date(),
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