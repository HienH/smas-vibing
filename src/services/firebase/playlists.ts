/**
 * @fileoverview Firebase playlists service for managing playlist data in Firestore.
 * 
 * Handles playlist creation, updates, and retrieval operations.
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
  Playlist, 
  CreatePlaylistData, 
  DatabaseResult, 
  COLLECTIONS 
} from '@/types/firebase'

/**
 * @description Creates a new playlist in Firestore.
 * @param {CreatePlaylistData} playlistData - Playlist data to create.
 * @returns {Promise<DatabaseResult<Playlist>>} Creation result.
 */
export async function createPlaylist(playlistData: CreatePlaylistData & { sharingLinkId?: string }): Promise<DatabaseResult<Playlist>> {
  try {
    const now = Timestamp.now()
    const playlistRef = doc(collection(db, COLLECTIONS.PLAYLISTS))
    
    const playlist: Playlist = {
      id: playlistRef.id,
      spotifyPlaylistId: playlistData.spotifyPlaylistId,
      spotifyUserId: playlistData.spotifyUserId,
      name: playlistData.name,
      description: playlistData.description,
      trackCount: 0,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      ...(playlistData.sharingLinkId ? { sharingLinkId: playlistData.sharingLinkId } : {}),
    }

    await setDoc(playlistRef, playlist)
  
    return {
      success: true,
      data: playlist,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create playlist',
    }
  }
}

/**
 * @description Retrieves a playlist by Firestore ID.
 * @param {string} playlistId - Firestore playlist ID.
 * @returns {Promise<DatabaseResult<Playlist>>} Playlist or error.
 */
export async function getPlaylistById(playlistId: string): Promise<DatabaseResult<Playlist>> {
  try {
    const playlistRef = doc(db, COLLECTIONS.PLAYLISTS, playlistId)
    const playlistSnap = await getDoc(playlistRef)
    
    if (!playlistSnap.exists()) {
      return {
        success: false,
        error: 'Playlist not found',
      }
    }
    
    return {
      success: true,
      data: playlistSnap.data() as Playlist,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get playlist',
    }
  }
}

/**
 * @description Retrieves a playlist by Spotify playlist ID.
 * @param {string} spotifyPlaylistId - Spotify playlist ID.
 * @returns {Promise<DatabaseResult<Playlist>>} Playlist or error.
 */
export async function getPlaylistBySpotifyId(spotifyPlaylistId: string): Promise<DatabaseResult<Playlist>> {
  try {
    const playlistsRef = collection(db, COLLECTIONS.PLAYLISTS)
    const q = query(playlistsRef, where('spotifyPlaylistId', '==', spotifyPlaylistId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Playlist not found',
      }
    }
    
    const playlistDoc = querySnapshot.docs[0]
    return {
      success: true,
      data: { id: playlistDoc.id, ...playlistDoc.data() } as Playlist,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get playlist by Spotify ID',
    }
  }
}

/**
 * @description Retrieves all playlists owned by a user.
 * @param {string} spotifyUserId - Spotify user ID.
 * @returns {Promise<DatabaseResult<Playlist[]>>} User's playlists or error.
 */
export async function getPlaylistsByOwner(spotifyUserId: string): Promise<DatabaseResult<Playlist[]>> {
  try {
    const playlistsRef = collection(db, COLLECTIONS.PLAYLISTS)
    const q = query(playlistsRef, where('spotifyUserId', '==', spotifyUserId), where('isActive', '==', true))
    const querySnapshot = await getDocs(q)
    
    const playlists: Playlist[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Playlist[]
    
    return {
      success: true,
      data: playlists,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user playlists',
    }
  }
}

/**
 * @description Updates playlist data.
 * @param {string} playlistId - Firestore playlist ID.
 * @param {Partial<Playlist>} updateData - Data to update.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function updatePlaylist(
  playlistId: string,
  updateData: Partial<Pick<Playlist, 'name' | 'description' | 'trackCount' | 'isActive' | 'sharingLinkId'>>
): Promise<DatabaseResult<void>> {
  try {
    const playlistRef = doc(db, COLLECTIONS.PLAYLISTS, playlistId)
    await updateDoc(playlistRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    })
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update playlist',
    }
  }
}

/**
 * @description Updates playlist track count.
 * @param {string} playlistId - Firestore playlist ID.
 * @param {number} trackCount - New track count.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function updatePlaylistTrackCount(
  playlistId: string,
  trackCount: number
): Promise<DatabaseResult<void>> {
  return await updatePlaylist(playlistId, { trackCount })
}

/**
 * @description Deactivates a playlist (soft delete).
 * @param {string} playlistId - Firestore playlist ID.
 * @returns {Promise<DatabaseResult<void>>} Deactivation result.
 */
export async function deactivatePlaylist(playlistId: string): Promise<DatabaseResult<void>> {
  return await updatePlaylist(playlistId, { isActive: false })
}

/**
 * @description Creates or retrieves existing playlist for user.
 * @param {CreatePlaylistData} playlistData - Playlist data.
 * @returns {Promise<DatabaseResult<Playlist>>} Playlist result.
 */
export async function getOrCreatePlaylist(playlistData: CreatePlaylistData): Promise<DatabaseResult<Playlist>> {
  try {
    // Check if playlist already exists
    const existingPlaylist = await getPlaylistBySpotifyId(playlistData.spotifyPlaylistId)
    
    if (existingPlaylist.success && existingPlaylist.data) {
      return existingPlaylist
    }
    
    // Create new playlist
    return await createPlaylist(playlistData)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get or create playlist',
    }
  }
}

/**
 * @description Updates playlist with sharingLinkId.
 * @param {string} playlistId - Firestore playlist ID.
 * @param {string} sharingLinkId - Firestore sharing link ID.
 * @returns {Promise<DatabaseResult<void>>} Update result.
 */
export async function updatePlaylistSharingLinkId(
  playlistId: string,
  sharingLinkId: string
): Promise<DatabaseResult<void>> {
  return await updatePlaylist(playlistId, { sharingLinkId })
} 