/**
 * @fileoverview Firebase client hook for accessing Firebase services in React components.
 * 
 * Provides easy access to Firebase services and handles common Firebase operations.
 */

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getUserById, getUserBySpotifyUserId } from '@/services/firebase-client/users'
import type { DatabaseResult, UserProfile } from '@/types/firebase'

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
  const getUserProfile = useCallback(async (userId: string): Promise<DatabaseResult<UserProfile>> => {
    return await getUserById(userId)
  }, [])

  const getUserProfileBySpotifyId = useCallback(async (spotifyUserId: string): Promise<DatabaseResult<UserProfile>> => {
    return await getUserBySpotifyUserId(spotifyUserId)
  }, [])

  return {
    getCurrentUserId,
    isAuthenticated,
    getUserProfile,
    getUserProfileBySpotifyId,
  }
} 
