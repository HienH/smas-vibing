/**
 * @fileoverview Firebase client users service for reading user profiles in Firestore (client SDK).
 *
 * Only safe, read-only functions for use in React components/hooks.
 */
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserProfile, DatabaseResult, COLLECTIONS } from '@/types/firebase'

export async function getUserById(userId: string): Promise<DatabaseResult<UserProfile>> {
    try {
        const userRef = doc(db, COLLECTIONS.USERS, userId)
        const userSnap = await getDoc(userRef)
        if (!userSnap.exists()) {
            return { success: false, error: 'User not found' }
        }
        return { success: true, data: userSnap.data() as UserProfile }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get user' }
    }
}

export async function getUserBySpotifyUserId(spotifyUserId: string): Promise<DatabaseResult<UserProfile>> {
    try {
        const usersRef = collection(db, COLLECTIONS.USERS)
        const q = query(usersRef, where('spotifyUserId', '==', spotifyUserId))
        const querySnapshot = await getDocs(q)
        if (querySnapshot.empty) {
            return { success: false, error: 'User not found' }
        }
        const userDoc = querySnapshot.docs[0]
        return { success: true, data: { id: userDoc.id, ...userDoc.data() } as UserProfile }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get user by Spotify user ID' }
    }
} 