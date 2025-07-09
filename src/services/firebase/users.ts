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
  Timestamp,
  collection,
  query,
  where,
  getDocs
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
      spotifyProviderAccountId: userData.spotifyProviderAccountId,
      spotifyUserId: userData.spotifyUserId,
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
 * @description Retrieves a user by internal UUID.
 * @param {string} userId - Internal UUID.
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
 * @param {string} userId - Internal user ID.
 * @param {Partial<UserProfile>} updateData - Data to update.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function updateUser(
  userId: string,
  updateData: Partial<Pick<UserProfile, 'displayName' | 'email' | 'imageUrl' | 'spotifyAccessToken' | 'spotifyRefreshToken' | 'spotifyTokenExpiresAt' | 'spotifyUserId' | 'spotifyProviderAccountId'>>
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
        spotifyProviderAccountId: userData.spotifyProviderAccountId,
        spotifyUserId: userData.spotifyUserId,
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

/**
 * @description Retrieves a user profile by Spotify provider account ID (from NextAuth).
 * @param {string} spotifyProviderAccountId - Spotify provider account ID from NextAuth.
 * @returns {Promise<DatabaseResult<UserProfile>>} User profile or error.
 */
export async function getUserBySpotifyProviderAccountId(spotifyProviderAccountId: string): Promise<DatabaseResult<UserProfile>> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS)
    const q = query(usersRef, where('spotifyProviderAccountId', '==', spotifyProviderAccountId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    const userDoc = querySnapshot.docs[0]
    return {
      success: true,
      data: { id: userDoc.id, ...userDoc.data() } as UserProfile,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user by Spotify provider account ID',
    }
  }
}

/**
 * @description Retrieves a user profile by Spotify user ID (from Spotify API).
 * @param {string} spotifyUserId - Spotify user ID from API.
 * @returns {Promise<DatabaseResult<UserProfile>>} User profile or error.
 */
export async function getUserBySpotifyUserId(spotifyUserId: string): Promise<DatabaseResult<UserProfile>> {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS)
    const q = query(usersRef, where('spotifyUserId', '==', spotifyUserId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    const userDoc = querySnapshot.docs[0]
    return {
      success: true,
      data: { id: userDoc.id, ...userDoc.data() } as UserProfile,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user by Spotify user ID',
    }
  }
}

/**
 * @description Retrieves a user profile by either Spotify provider account ID or Spotify user ID.
 * @param {string} spotifyId - Either spotifyProviderAccountId or spotifyUserId.
 * @returns {Promise<DatabaseResult<UserProfile>>} User profile or error.
 */
export async function getUserBySpotifyId(spotifyId: string): Promise<DatabaseResult<UserProfile>> {
  try {
    // First try to find by spotifyProviderAccountId
    const providerResult = await getUserBySpotifyProviderAccountId(spotifyId)
    if (providerResult.success && providerResult.data) {
      return providerResult
    }

    // If not found, try by spotifyUserId
    const userResult = await getUserBySpotifyUserId(spotifyId)
    if (userResult.success && userResult.data) {
      return userResult
    }

    return {
      success: false,
      error: 'User not found',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user by Spotify ID',
    }
  }
}

/**
 * @description Retrieves a user profile by NextAuth user ID, checking both users and accounts collections.
 * @param {string} nextAuthUserId - NextAuth user ID.
 * @returns {Promise<DatabaseResult<UserProfile>>} User profile or error.
 */
export async function getUserByNextAuthId(nextAuthUserId: string): Promise<DatabaseResult<UserProfile>> {
  try {
    console.log('🔍 getUserByNextAuthId: Looking for user with ID:', nextAuthUserId)

    // First try to find in users collection (our custom data)
    const userResult = await getUserById(nextAuthUserId)
    if (userResult.success && userResult.data) {
      console.log('🔍 getUserByNextAuthId: Found user in users collection')
      return userResult
    }

    // If not found in users, try to find in accounts collection
    console.log('🔍 getUserByNextAuthId: User not found in users collection, checking accounts...')
    const accountsRef = collection(db, 'accounts')
    const q = query(accountsRef, where('userId', '==', nextAuthUserId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const accountDoc = querySnapshot.docs[0]
      const accountData = accountDoc.data()
      console.log('🔍 getUserByNextAuthId: Found account in accounts collection:', accountData)

      // Try to find user by provider account ID
      if (accountData.providerAccountId) {
        const providerResult = await getUserBySpotifyProviderAccountId(accountData.providerAccountId)
        if (providerResult.success && providerResult.data) {
          console.log('🔍 getUserByNextAuthId: Found user by provider account ID')
          return providerResult
        }
      }
    }

    console.log('🔍 getUserByNextAuthId: User not found in any collection')
    return {
      success: false,
      error: 'User not found in users or accounts collection',
    }
  } catch (error) {
    console.error('🔍 getUserByNextAuthId: Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user by NextAuth ID',
    }
  }
} 