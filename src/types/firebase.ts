/**
 * @fileoverview Firebase Firestore database types for SMAS.
 * 
 * Defines TypeScript interfaces for users, playlists, contributions, and sharing links.
 */

import { Timestamp } from 'firebase/firestore'
import admin from 'firebase-admin'

/**
 * @description User profile data stored in Firestore.
 */
export interface UserProfile {
  id: string
  spotifyProviderAccountId: string
  spotifyUserId: string
  displayName: string
  email: string
  imageUrl?: string
  spotifyAccessToken?: string
  spotifyRefreshToken?: string
  spotifyTokenExpiresAt?: admin.firestore.Timestamp
  createdAt: admin.firestore.Timestamp
  updatedAt: admin.firestore.Timestamp
}

/**
 * @description Playlist data stored in Firestore.
 */
export interface Playlist {
  id: string // Firestore document ID
  spotifyPlaylistId: string // Spotify playlist ID
  spotifyUserId: string // Spotify user ID
  name: string
  description?: string
  trackCount: number
  createdAt: admin.firestore.Timestamp
  updatedAt: admin.firestore.Timestamp
  isActive: boolean
  sharingLinkId?: string // Firestore sharing link ID for this playlist
}

/**
 * @description Contribution data stored in Firestore.
 */
export interface Contribution {
  id: string // Firestore document ID
  playlistId: string // Firestore playlist ID
  contributorId: string // Internal UUID (not Spotify ID)
  contributorName: string
  tracks: any[]
  createdAt: admin.firestore.Timestamp
  expiresAt: admin.firestore.Timestamp // 4 weeks from creation
}

/**
 * @description Individual track within a contribution.
 */
export interface ContributionTrack {
  spotifyTrackId: string
  name: string
  artist: string
  album?: string
  imageUrl?: string
  duration?: number
}

/**
 * @description Sharing link data stored in Firestore.
 */
export interface SharingLink {
  id: string // Firestore document ID
  playlistId: string // Firestore playlist ID
  spotifyUserId: string // Spotify user ID
  ownerName: string
  linkSlug: string // Unique identifier for the link
  isActive: boolean
  createdAt: admin.firestore.Timestamp
  updatedAt: admin.firestore.Timestamp
  usageCount: number
  lastUsedAt?: admin.firestore.Timestamp
}

/**
 * @description User's top songs data (for display purposes).
 */
export interface UserTopSongs {
  userId: string // Spotify user ID
  songs: TopSong[]
  lastFetched: Timestamp
}

/**
 * @description Individual top song data.
 */
export interface TopSong {
  spotifyTrackId: string
  name: string
  artist: string
  album?: string
  imageUrl?: string
  duration?: number
  rank: number // Position in user's top songs
}

/**
 * @description Firestore collection names.
 */
export const COLLECTIONS = {
  USERS: 'users',
  PLAYLISTS: 'playlists',
  CONTRIBUTIONS: 'contributions',
  SHARING_LINKS: 'sharing_links',
  USER_TOP_SONGS: 'user_top_songs',
} as const

/**
 * @description Database operation result types.
 */
export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * @description User creation data.
 */
export interface CreateUserData {
  id: string // Internal UUID - used in session
  spotifyProviderAccountId: string
  spotifyUserId: string // Spotify ID - kept private
  displayName: string
  email: string
  imageUrl?: string
  spotifyAccessToken?: string
  spotifyRefreshToken?: string
  spotifyTokenExpiresAt?: Timestamp
}

/**
 * @description Playlist creation data.
 */
export interface CreatePlaylistData {
  spotifyPlaylistId: string
  spotifyUserId: string // Spotify user ID
  name: string
  description?: string
  imageUrl?: string
}

/**
 * @description Contribution creation data.
 */
export interface CreateContributionData {
  playlistId: string
  contributorId: string // Internal UUID (not Spotify ID)
  contributorName: string
  tracks: ContributionTrack[]
}

/**
 * @description Sharing link creation data.
 */
export interface CreateSharingLinkData {
  playlistId: string
  spotifyUserId: string
  ownerName: string
  linkSlug: string
} 