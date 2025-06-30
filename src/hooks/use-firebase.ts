/**
 * @fileoverview Firebase client hook for accessing Firebase services in React components.
 * 
 * Provides easy access to Firebase services and handles common Firebase operations.
 */

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  upsertUser,
  getUserById,
  updateUserTokens,
  createPlaylist,
  getPlaylistById,
  getPlaylistsByOwner,
  updatePlaylistTrackCount,
  createContribution,
  getContributionsByPlaylist,
  checkUserContribution,
  createSharingLink,
  getSharingLinkBySlug,
  getSharingLinksByOwner,
  incrementSharingLinkUsage,
  generateUniqueLinkSlug,
} from '@/services/firebase'
import type { 
  CreateUserData,
  CreatePlaylistData,
  CreateContributionData,
  CreateSharingLinkData,
  DatabaseResult,
  UserProfile,
  Playlist,
  Contribution,
  SharingLink,
} from '@/types/firebase'

/**
 * @description Custom hook for Firebase operations.
 * @returns {Object} Firebase service functions and utilities.
 */
export const useFirebase = () => {
  const { data: session } = useSession()

  /**
   * @description Get current user ID from session.
   * @returns {string | null} Current user ID or null.
   */
  const getCurrentUserId = useCallback((): string | null => {
    return session?.user?.id || null
  }, [session])

  /**
   * @description Check if user is authenticated.
   * @returns {boolean} Authentication status.
   */
  const isAuthenticated = useCallback((): boolean => {
    return !!session?.user?.id
  }, [session])

  // User operations
  const createUserProfile = useCallback(async (userData: CreateUserData): Promise<DatabaseResult<UserProfile>> => {
    return await upsertUser(userData)
  }, [])

  const getUserProfile = useCallback(async (userId: string): Promise<DatabaseResult<UserProfile>> => {
    return await getUserById(userId)
  }, [])

  const updateUserSpotifyTokens = useCallback(async (
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<DatabaseResult<void>> => {
    return await updateUserTokens(userId, accessToken, refreshToken, expiresIn)
  }, [])

  // Playlist operations
  const createUserPlaylist = useCallback(async (playlistData: CreatePlaylistData): Promise<DatabaseResult<Playlist>> => {
    return await createPlaylist(playlistData)
  }, [])

  const getPlaylist = useCallback(async (playlistId: string): Promise<DatabaseResult<Playlist>> => {
    return await getPlaylistById(playlistId)
  }, [])

  const getUserPlaylists = useCallback(async (ownerId: string): Promise<DatabaseResult<Playlist[]>> => {
    return await getPlaylistsByOwner(ownerId)
  }, [])

  const updatePlaylistTracks = useCallback(async (playlistId: string, trackCount: number): Promise<DatabaseResult<void>> => {
    return await updatePlaylistTrackCount(playlistId, trackCount)
  }, [])

  // Contribution operations
  const addContribution = useCallback(async (contributionData: CreateContributionData): Promise<DatabaseResult<Contribution>> => {
    return await createContribution(contributionData)
  }, [])

  const getPlaylistContributions = useCallback(async (playlistId: string): Promise<DatabaseResult<Contribution[]>> => {
    return await getContributionsByPlaylist(playlistId)
  }, [])

  const checkContribution = useCallback(async (playlistId: string, contributorId: string): Promise<DatabaseResult<{hasContributed: boolean, contribution?: Contribution}>> => {
    return await checkUserContribution(playlistId, contributorId)
  }, [])

  // Sharing link operations
  const createSharingLinkForPlaylist = useCallback(async (linkData: CreateSharingLinkData): Promise<DatabaseResult<SharingLink>> => {
    return await createSharingLink(linkData)
  }, [])

  const getSharingLink = useCallback(async (linkSlug: string): Promise<DatabaseResult<SharingLink>> => {
    return await getSharingLinkBySlug(linkSlug)
  }, [])

  const getUserSharingLinks = useCallback(async (ownerId: string): Promise<DatabaseResult<SharingLink[]>> => {
    return await getSharingLinksByOwner(ownerId)
  }, [])

  const trackLinkUsage = useCallback(async (linkId: string): Promise<DatabaseResult<void>> => {
    return await incrementSharingLinkUsage(linkId)
  }, [])

  const generateLinkSlug = useCallback(async (): Promise<DatabaseResult<string>> => {
    return await generateUniqueLinkSlug()
  }, [])

  return {
    // Authentication utilities
    getCurrentUserId,
    isAuthenticated,
    
    // User operations
    createUserProfile,
    getUserProfile,
    updateUserSpotifyTokens,
    
    // Playlist operations
    createUserPlaylist,
    getPlaylist,
    getUserPlaylists,
    updatePlaylistTracks,
    
    // Contribution operations
    addContribution,
    getPlaylistContributions,
    checkContribution,
    
    // Sharing link operations
    createSharingLinkForPlaylist,
    getSharingLink,
    getUserSharingLinks,
    trackLinkUsage,
    generateLinkSlug,
  }
} 