/**
 * @fileoverview Firebase contributions service for managing contribution data in Firestore.
 * 
 * Handles contribution creation, validation, and retrieval operations.
 */

import admin from 'firebase-admin'
import { adminDb as db } from '@/lib/firebaseAdmin'
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
    const now = admin.firestore.Timestamp.now()
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 4 * 7 * 24 * 60 * 60 * 1000) // 4 weeks
    const contributionRef = db.collection(COLLECTIONS.CONTRIBUTIONS).doc()

    const contribution: Contribution = {
      id: contributionRef.id,
      playlistId: contributionData.playlistId,
      contributorId: contributionData.contributorId,
      contributorName: contributionData.contributorName,
      spotifyTrackUris: contributionData.spotifyTrackUris,
      createdAt: now,
      expiresAt,
    }

    await contributionRef.set(contribution)

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
    const contributionRef = db.collection(COLLECTIONS.CONTRIBUTIONS).doc(contributionId)
    const contributionSnap = await contributionRef.get()

    if (!contributionSnap.exists) {
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
    const contributionsRef = db.collection(COLLECTIONS.CONTRIBUTIONS)
    const q = contributionsRef.where('playlistId', '==', playlistId)
    const querySnapshot = await q.get()

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
    const contributionsRef = db.collection(COLLECTIONS.CONTRIBUTIONS)
    const q = contributionsRef.where('contributorId', '==', contributorId)
    const querySnapshot = await q.get()

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
): Promise<DatabaseResult<{ hasContributed: boolean, contribution?: Contribution }>> {
  try {
    const contributionsRef = db.collection(COLLECTIONS.CONTRIBUTIONS)
    const querySnap = await contributionsRef.where('playlistId', '==', playlistId).where('contributorId', '==', contributorId).get()

    if (querySnap.empty) {
      return {
        success: true,
        data: { hasContributed: false },
      }
    }

    const contribution = {
      id: querySnap.docs[0].id,
      ...querySnap.docs[0].data(),
    } as Contribution

    const now = admin.firestore.Timestamp.now()
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

    const now = admin.firestore.Timestamp.now()
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
 * @returns {Promise<DatabaseResult<Array<{track: unknown, contributor: string}>>>} All tracks with contributor info or error.
 */
export async function getAllContributedTracks(playlistId: string): Promise<DatabaseResult<Array<{ track: unknown, contributor: string }>>> {
  try {
    const contributions = await getActiveContributions(playlistId)

    if (!contributions.success || !contributions.data) {
      return {
        success: false,
        error: contributions.error || 'Failed to get contributions',
      }
    }

    const allTracks: Array<{ track: unknown, contributor: string }> = []

    contributions.data.forEach(contribution => {
      contribution.spotifyTrackUris.forEach(uri => {
        allTracks.push({
          track: uri,
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