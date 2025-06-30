/**
 * @fileoverview Firebase users service for managing user profiles in Firestore.
 * 
 * Handles user creation, updates, and retrieval operations.
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  UserProfile, 
  CreateUserData, 
  DatabaseResult, 
  COLLECTIONS 
} from '@/types/firebase'

/**
 * @description Creates a new user profile in Firestore.
 * @param {CreateUserData} userData - User data to create.
 * @returns {Promise<DatabaseResult<UserProfile>>} Creation result.
 */
export async function createUser(userData: CreateUserData): Promise<DatabaseResult<UserProfile>> {
  try {
    const now = Timestamp.now()
    const userRef = doc(db, COLLECTIONS.USERS, userData.id)
    
    const userProfile: UserProfile = {
      id: userData.id,
      displayName: userData.displayName,
      email: userData.email,
      imageUrl: userData.imageUrl,
      spotifyAccessToken: userData.spotifyAccessToken,
      spotifyRefreshToken: userData.spotifyRefreshToken,
      spotifyTokenExpiresAt: userData.spotifyTokenExpiresAt,
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(userRef, userProfile)
    
    return {
      success: true,
      data: userProfile,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    }
  }
}

/**
 * @description Retrieves a user profile by Spotify ID.
 * @param {string} userId - Spotify user ID.
 * @returns {Promise<DatabaseResult<UserProfile>>} User profile or error.
 */
export async function getUserById(userId: string): Promise<DatabaseResult<UserProfile>> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return {
        success: false,
        error: 'User not found',
      }
    }
    
    return {
      success: true,
      data: userSnap.data() as UserProfile,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    }
  }
}

/**
 * @description Updates user profile data.
 * @param {string} userId - Spotify user ID.
 * @param {Partial<UserProfile>} updateData - Data to update.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function updateUser(
  userId: string, 
  updateData: Partial<Pick<UserProfile, 'displayName' | 'email' | 'imageUrl' | 'spotifyAccessToken' | 'spotifyRefreshToken' | 'spotifyTokenExpiresAt'>>
): Promise<DatabaseResult<void>> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    })
    
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    }
  }
}

/**
 * @description Updates user's Spotify tokens.
 * @param {string} userId - Spotify user ID.
 * @param {string} accessToken - New access token.
 * @param {string} refreshToken - New refresh token.
 * @param {number} expiresIn - Token expiration time in seconds.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function updateUserTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<DatabaseResult<void>> {
  try {
    const expiresAt = Timestamp.fromMillis(Date.now() + expiresIn * 1000)
    
    return await updateUser(userId, {
      spotifyAccessToken: accessToken,
      spotifyRefreshToken: refreshToken,
      spotifyTokenExpiresAt: expiresAt,
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user tokens',
    }
  }
}

/**
 * @description Creates or updates user profile with Spotify data.
 * @param {CreateUserData} userData - User data from Spotify.
 * @returns {Promise<DatabaseResult<UserProfile>>} User profile result.
 */
export async function upsertUser(userData: CreateUserData): Promise<DatabaseResult<UserProfile>> {
  try {
    const existingUser = await getUserById(userData.id)
    
    if (existingUser.success && existingUser.data) {
      // Update existing user
      const updateResult = await updateUser(userData.id, {
        displayName: userData.displayName,
        email: userData.email,
        imageUrl: userData.imageUrl,
        spotifyAccessToken: userData.spotifyAccessToken,
        spotifyRefreshToken: userData.spotifyRefreshToken,
        spotifyTokenExpiresAt: userData.spotifyTokenExpiresAt,
      })
      
      if (updateResult.success) {
        return {
          success: true,
          data: { ...existingUser.data, ...userData },
        }
      }
      
      return {
        success: false,
        error: updateResult.error || 'Failed to update user',
      }
    }
    
    // Create new user
    return await createUser(userData)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upsert user',
    }
  }
} 