/**
 * @fileoverview Firebase Admin SDK initialization for server-side operations.
 *
 * Exports Firestore instance and credential config for NextAuth Firebase Adapter.
 */

import { getApps, initializeApp, cert, App, ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount: ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

let adminApp: App
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
  })
} else {
  adminApp = getApps()[0]
}

export const adminDb = getFirestore(adminApp)

/**
 * @description Admin SDK config for NextAuth FirestoreAdapter.
 */
export const adminAdapterConfig = {
  credential: cert(serviceAccount),
} 