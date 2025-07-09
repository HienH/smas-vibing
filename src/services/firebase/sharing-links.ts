/**
 * @fileoverview Firebase sharing links service for managing sharing link data in Firestore.
 * 
 * Handles sharing link creation, retrieval, and usage tracking.
 */

import admin from 'firebase-admin'
import { adminDb as db } from '@/lib/firebaseAdmin'
import {
  SharingLink,
  CreateSharingLinkData,
  DatabaseResult,
  COLLECTIONS
} from '@/types/firebase'
import { updatePlaylistSharingLinkId } from './playlists'

/**
 * @description Creates a new sharing link in Firestore.
 * @param {CreateSharingLinkData} linkData - Sharing link data to create.
 * @returns {Promise<DatabaseResult<SharingLink>>} Creation result.
 */
export async function createSharingLink(linkData: CreateSharingLinkData): Promise<DatabaseResult<SharingLink>> {
  try {
    const now = admin.firestore.Timestamp.now()
    const linkRef = db.collection(COLLECTIONS.SHARING_LINKS).doc()

    const sharingLink: SharingLink = {
      id: linkRef.id,
      playlistId: linkData.playlistId,
      spotifyUserId: linkData.spotifyUserId,
      ownerName: linkData.ownerName,
      linkSlug: linkData.linkSlug,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    }

    await linkRef.set(sharingLink)

    await updatePlaylistSharingLinkId(linkData.playlistId, linkRef.id)

    return {
      success: true,
      data: sharingLink,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sharing link',
    }
  }
}

/**
 * @description Retrieves a sharing link by Firestore ID.
 * @param {string} linkId - Firestore sharing link ID.
 * @returns {Promise<DatabaseResult<SharingLink>>} Sharing link or error.
 */
export async function getSharingLinkById(linkId: string): Promise<DatabaseResult<SharingLink>> {
  try {
    const linkRef = db.collection(COLLECTIONS.SHARING_LINKS).doc(linkId)
    const linkSnap = await linkRef.get()

    if (!linkSnap.exists) {
      return {
        success: false,
        error: 'Sharing link not found',
      }
    }

    return {
      success: true,
      data: linkSnap.data() as SharingLink,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sharing link',
    }
  }
}

/**
 * @description Retrieves a sharing link by slug.
 * @param {string} linkSlug - Unique link slug.
 * @returns {Promise<DatabaseResult<SharingLink>>} Sharing link or error.
 */
export async function getSharingLinkBySlug(linkSlug: string): Promise<DatabaseResult<SharingLink>> {
  try {
    const linksRef = db.collection(COLLECTIONS.SHARING_LINKS)
    const q = linksRef.where('linkSlug', '==', linkSlug).where('isActive', '==', true)
    const querySnapshot = await q.get()

    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Sharing link not found',
      }
    }

    const linkDoc = querySnapshot.docs[0]
    return {
      success: true,
      data: { id: linkDoc.id, ...linkDoc.data() } as SharingLink,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sharing link by slug',
    }
  }
}

/**
 * @description Retrieves all sharing links for a playlist.
 * @param {string} playlistId - Firestore playlist ID.
 * @returns {Promise<DatabaseResult<SharingLink[]>>} Playlist sharing links or error.
 */
export async function getSharingLinksByPlaylist(playlistId: string): Promise<DatabaseResult<SharingLink[]>> {
  try {
    const linksRef = db.collection(COLLECTIONS.SHARING_LINKS)
    const q = linksRef.where('playlistId', '==', playlistId).where('isActive', '==', true)
    const querySnapshot = await q.get()

    const sharingLinks: SharingLink[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SharingLink[]

    return {
      success: true,
      data: sharingLinks,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get playlist sharing links',
    }
  }
}

/**
 * @description Retrieves a single sharing link owned by a user.
 * @param {string} spotifyUserId - Spotify user ID.
 * @returns {Promise<DatabaseResult<SharingLink>>} User's sharing link or error.
 */
export async function getSharingLinkByOwner(spotifyUserId: string): Promise<DatabaseResult<SharingLink>> {
  try {
    const linksRef = db.collection(COLLECTIONS.SHARING_LINKS)
    const querySnap = await linksRef.where('spotifyUserId', '==', spotifyUserId).where('isActive', '==', true).get()

    if (querySnap.empty) {
      return {
        success: false,
        error: 'Sharing link not found',
      }
    }

    const linkDoc = querySnap.docs[0]
    return {
      success: true,
      data: { id: linkDoc.id, ...linkDoc.data() } as SharingLink,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user sharing link',
    }
  }
}

/**
 * @description Updates sharing link data.
 * @param {string} linkId - Firestore sharing link ID.
 * @param {Partial<SharingLink>} updateData - Data to update.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function updateSharingLink(
  linkId: string,
  updateData: Partial<Pick<SharingLink, 'ownerName' | 'isActive' | 'usageCount' | 'lastUsedAt' | 'playlistId'>>
): Promise<DatabaseResult<void>> {
  try {
    const linkRef = db.collection(COLLECTIONS.SHARING_LINKS).doc(linkId)

    await linkRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sharing link',
    }
  }
}

/**
 * @description Increments usage count for a sharing link.
 * @param {string} linkId - Firestore sharing link ID.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function incrementSharingLinkUsage(linkId: string): Promise<DatabaseResult<void>> {
  try {
    const linkRef = db.collection(COLLECTIONS.SHARING_LINKS).doc(linkId)
    const linkSnap = await linkRef.get()

    if (!linkSnap.exists) {
      return {
        success: false,
        error: 'Sharing link not found',
      }
    }

    const currentData = linkSnap.data() as SharingLink
    const now = admin.firestore.Timestamp.now()

    await linkRef.update({
      usageCount: currentData.usageCount + 1,
      lastUsedAt: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to increment sharing link usage',
    }
  }
}

/**
 * @description Deactivates a sharing link (soft delete).
 * @param {string} linkId - Firestore sharing link ID.
 * @returns {Promise<DatabaseResult<void>>} Deactivation result.
 */
export async function deactivateSharingLink(linkId: string): Promise<DatabaseResult<void>> {
  return await updateSharingLink(linkId, { isActive: false })
}

/**
 * @description Checks if a link slug is available (unique).
 * @param {string} linkSlug - Link slug to check.
 * @returns {Promise<DatabaseResult<boolean>>} Availability result.
 */
export async function isLinkSlugAvailable(linkSlug: string): Promise<DatabaseResult<boolean>> {
  try {
    const linksRef = db.collection(COLLECTIONS.SHARING_LINKS)
    const querySnap = await linksRef.where('linkSlug', '==', linkSlug).get()

    return {
      success: true,
      data: querySnap.empty,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check link slug availability',
    }
  }
}

/**
 * @description Generates a unique link slug.
 * @returns {Promise<DatabaseResult<string>>} Generated slug or error.
 */
export async function generateUniqueLinkSlug(): Promise<DatabaseResult<string>> {
  try {
    const generateSlug = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const slug = generateSlug()
      const availability = await isLinkSlugAvailable(slug)

      if (availability.success && availability.data) {
        return {
          success: true,
          data: slug,
        }
      }

      attempts++
    }

    return {
      success: false,
      error: 'Failed to generate unique link slug after maximum attempts',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate unique link slug',
    }
  }
} 