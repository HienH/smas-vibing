/**
 * @fileoverview Firebase sharing links service for managing sharing link data in Firestore.
 * 
 * Handles sharing link creation, retrieval, and usage tracking.
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  SharingLink, 
  CreateSharingLinkData, 
  DatabaseResult, 
  COLLECTIONS 
} from '@/types/firebase'
import { getUserBySpotifyUserId, updateUser } from './users'
import { updatePlaylistSharingLinkId } from './playlists'

/**
 * @description Creates a new sharing link in Firestore.
 * @param {CreateSharingLinkData} linkData - Sharing link data to create.
 * @returns {Promise<DatabaseResult<SharingLink>>} Creation result.
 */
export async function createSharingLink(linkData: CreateSharingLinkData): Promise<DatabaseResult<SharingLink>> {
  try {
    const now = Timestamp.now()
    const linkRef = doc(collection(db, COLLECTIONS.SHARING_LINKS))
    
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

    await setDoc(linkRef, sharingLink)

    const userCheck = await getUserBySpotifyUserId(linkData.spotifyUserId)
      if (userCheck.data) {
        await updateUser(userCheck.data.id, { 
          sharingLinkId: linkRef.id
        })
    }
   
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
    const linkRef = doc(db, COLLECTIONS.SHARING_LINKS, linkId)
    const linkSnap = await getDoc(linkRef)
    
    if (!linkSnap.exists()) {
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
    const linksRef = collection(db, COLLECTIONS.SHARING_LINKS)
    const q = query(linksRef, where('linkSlug', '==', linkSlug), where('isActive', '==', true))
    const querySnapshot = await getDocs(q)
    
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
    const linksRef = collection(db, COLLECTIONS.SHARING_LINKS)
    const q = query(linksRef, where('playlistId', '==', playlistId), where('isActive', '==', true))
    const querySnapshot = await getDocs(q)
    
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
 * @description Retrieves all sharing links owned by a user.
 * @param {string} spotifyUserId - Spotify user ID.
 * @returns {Promise<DatabaseResult<SharingLink[]>>} User's sharing links or error.
 */
export async function getSharingLinksByOwner(spotifyUserId: string): Promise<DatabaseResult<SharingLink[]>> {
  try {
    const linksRef = collection(db, COLLECTIONS.SHARING_LINKS)
    const q = query(linksRef, where('spotifyUserId', '==', spotifyUserId), where('isActive', '==', true))
    const querySnapshot = await getDocs(q)
    
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
      error: error instanceof Error ? error.message : 'Failed to get user sharing links',
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
  updateData: Partial<Pick<SharingLink, 'ownerName' | 'isActive' | 'usageCount' | 'lastUsedAt'>>
): Promise<DatabaseResult<void>> {
  try {
    const linkRef = doc(db, COLLECTIONS.SHARING_LINKS, linkId)
    
    await updateDoc(linkRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
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
    const linkRef = doc(db, COLLECTIONS.SHARING_LINKS, linkId)
    const linkSnap = await getDoc(linkRef)
    
    if (!linkSnap.exists()) {
      return {
        success: false,
        error: 'Sharing link not found',
      }
    }
    
    const currentData = linkSnap.data() as SharingLink
    const now = Timestamp.now()
    
    await updateDoc(linkRef, {
      usageCount: currentData.usageCount + 1,
      lastUsedAt: now,
      updatedAt: serverTimestamp(),
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
    const linksRef = collection(db, COLLECTIONS.SHARING_LINKS)
    const q = query(linksRef, where('linkSlug', '==', linkSlug))
    const querySnapshot = await getDocs(q)
    
    return {
      success: true,
      data: querySnapshot.empty,
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