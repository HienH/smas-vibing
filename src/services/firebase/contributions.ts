/**
 * @fileoverview Firebase contributions service for managing contribution data in Firestore.
 * 
 * Handles contribution creation, validation, and retrieval operations.
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  Contribution, 
  CreateContributionData, 
  DatabaseResult, 
  COLLECTIONS 
} from '@/types/firebase'

/**
 * @description Creates a new contribution in Firestore.
 * @param {CreateContributionData} contributionData - Contribution data to create.
 * @returns {Promise<DatabaseResult<Contribution>>} Creation result.
 */
export async function createContribution(contributionData: CreateContributionData): Promise<DatabaseResult<Contribution>> {
  try {
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + 4 * 7 * 24 * 60 * 60 * 1000) // 4 weeks
    const contributionRef = doc(collection(db, COLLECTIONS.CONTRIBUTIONS))
    
    const contribution: Contribution = {
      id: contributionRef.id,
      playlistId: contributionData.playlistId,
      contributorId: contributionData.contributorId,
      contributorName: contributionData.contributorName,
      contributorEmail: contributionData.contributorEmail,
      tracks: contributionData.tracks,
      createdAt: now,
      expiresAt,
    }

    await setDoc(contributionRef, contribution)
    
    return {
      success: true,
      data: contribution,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contribution',
    }
  }
}

/**
 * @description Retrieves a contribution by Firestore ID.
 * @param {string} contributionId - Firestore contribution ID.
 * @returns {Promise<DatabaseResult<Contribution>>} Contribution or error.
 */
export async function getContributionById(contributionId: string): Promise<DatabaseResult<Contribution>> {
  try {
    const contributionRef = doc(db, COLLECTIONS.CONTRIBUTIONS, contributionId)
    const contributionSnap = await getDoc(contributionRef)
    
    if (!contributionSnap.exists()) {
      return {
        success: false,
        error: 'Contribution not found',
      }
    }
    
    return {
      success: true,
      data: contributionSnap.data() as Contribution,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get contribution',
    }
  }
}

/**
 * @description Retrieves all contributions for a playlist.
 * @param {string} playlistId - Firestore playlist ID.
 * @returns {Promise<DatabaseResult<Contribution[]>>} Playlist contributions or error.
 */
export async function getContributionsByPlaylist(playlistId: string): Promise<DatabaseResult<Contribution[]>> {
  try {
    const contributionsRef = collection(db, COLLECTIONS.CONTRIBUTIONS)
    const q = query(contributionsRef, where('playlistId', '==', playlistId))
    const querySnapshot = await getDocs(q)
    
    const contributions: Contribution[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Contribution[]
    
    return {
      success: true,
      data: contributions,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get playlist contributions',
    }
  }
}

/**
 * @description Retrieves all contributions by a user.
 * @param {string} contributorId - Spotify user ID.
 * @returns {Promise<DatabaseResult<Contribution[]>>} User contributions or error.
 */
export async function getContributionsByUser(contributorId: string): Promise<DatabaseResult<Contribution[]>> {
  try {
    const contributionsRef = collection(db, COLLECTIONS.CONTRIBUTIONS)
    const q = query(contributionsRef, where('contributorId', '==', contributorId))
    const querySnapshot = await getDocs(q)
    
    const contributions: Contribution[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Contribution[]
    
    return {
      success: true,
      data: contributions,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user contributions',
    }
  }
}

/**
 * @description Checks if a user has already contributed to a playlist within the 4-week window.
 * @param {string} playlistId - Firestore playlist ID.
 * @param {string} contributorId - Spotify user ID.
 * @returns {Promise<DatabaseResult<{hasContributed: boolean, contribution?: Contribution}>>} Contribution check result.
 */
export async function checkUserContribution(
  playlistId: string,
  contributorId: string
): Promise<DatabaseResult<{hasContributed: boolean, contribution?: Contribution}>> {
  try {
    const contributionsRef = collection(db, COLLECTIONS.CONTRIBUTIONS)
    const q = query(
      contributionsRef, 
      where('playlistId', '==', playlistId),
      where('contributorId', '==', contributorId)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {
        success: true,
        data: { hasContributed: false },
      }
    }
    
    const contribution = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    } as Contribution
    
    const now = Timestamp.now()
    const isExpired = contribution.expiresAt.toMillis() < now.toMillis()
    
    return {
      success: true,
      data: { 
        hasContributed: !isExpired,
        contribution: isExpired ? undefined : contribution,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check user contribution',
    }
  }
}

/**
 * @description Gets all active contributions for a playlist (not expired).
 * @param {string} playlistId - Firestore playlist ID.
 * @returns {Promise<DatabaseResult<Contribution[]>>} Active contributions or error.
 */
export async function getActiveContributions(playlistId: string): Promise<DatabaseResult<Contribution[]>> {
  try {
    const contributions = await getContributionsByPlaylist(playlistId)
    
    if (!contributions.success || !contributions.data) {
      return contributions
    }
    
    const now = Timestamp.now()
    const activeContributions = contributions.data.filter(
      contribution => contribution.expiresAt.toMillis() > now.toMillis()
    )
    
    return {
      success: true,
      data: activeContributions,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get active contributions',
    }
  }
}

/**
 * @description Gets all tracks from all contributions for a playlist.
 * @param {string} playlistId - Firestore playlist ID.
 * @returns {Promise<DatabaseResult<Array<{track: any, contributor: string}>>>} All tracks with contributor info or error.
 */
export async function getAllContributedTracks(playlistId: string): Promise<DatabaseResult<Array<{track: any, contributor: string}>>> {
  try {
    const contributions = await getActiveContributions(playlistId)
    
    if (!contributions.success || !contributions.data) {
      return {
        success: false,
        error: contributions.error || 'Failed to get contributions',
      }
    }
    
    const allTracks: Array<{track: any, contributor: string}> = []
    
    contributions.data.forEach(contribution => {
      contribution.tracks.forEach(track => {
        allTracks.push({
          track,
          contributor: contribution.contributorName,
        })
      })
    })
    
    return {
      success: true,
      data: allTracks,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all contributed tracks',
    }
  }
} 