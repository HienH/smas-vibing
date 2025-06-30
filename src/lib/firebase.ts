/**
 * @fileoverview Firebase configuration and Firestore client setup for SMAS.
 * 
 * Provides Firebase app initialization and Firestore client for database operations.
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
/**
 * @description Initialize Firebase app or return existing instance.
 */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

/**
 * @description Firestore database instance.
 */
export const db = getFirestore(app)

/**
 * @description Firebase Auth instance.
 */
export const auth = getAuth(app)

/**
 * @description Connect to Firebase emulators in development.
 */
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099')
  } catch (error) {
    console.warn('Firebase emulator already connected')
  }
}

export default app 