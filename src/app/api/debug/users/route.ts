/**
 * @fileoverview Debug API route to inspect user data in both users and accounts collections.
 * 
 * This route helps troubleshoot user data issues in production by showing what's in both collections.
 * Only available in development or with a secret key.
 */
import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * @description Debug endpoint to inspect user data in both collections.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<NextResponse>} Debug information about users.
 */
export async function GET(request: NextRequest) {
    // Only allow in development or with secret key
    const isDev = process.env.NODE_ENV === 'development'
    const secretKey = request.nextUrl.searchParams.get('key')
    const allowedKey = process.env.DEBUG_SECRET_KEY

    if (!isDev && secretKey !== allowedKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const userId = request.nextUrl.searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
        }

        console.log('🔍 Debug: Looking for user:', userId)

        // Check users collection
        const usersRef = collection(db, 'users')
        const usersQuery = query(usersRef, where('__name__', '==', userId))
        const usersSnapshot = await getDocs(usersQuery)

        const userData = usersSnapshot.empty ? null : {
            id: usersSnapshot.docs[0].id,
            ...usersSnapshot.docs[0].data()
        } as any

        // Check accounts collection
        const accountsRef = collection(db, 'accounts')
        const accountsQuery = query(accountsRef, where('userId', '==', userId))
        const accountsSnapshot = await getDocs(accountsQuery)

        const accountData = accountsSnapshot.empty ? null : {
            id: accountsSnapshot.docs[0].id,
            ...accountsSnapshot.docs[0].data()
        } as any

        return NextResponse.json({
            userId,
            usersCollection: userData,
            accountsCollection: accountData,
            summary: {
                hasUserData: !!userData,
                hasAccountData: !!accountData,
                spotifyUserId: userData?.spotifyUserId,
                spotifyProviderAccountId: userData?.spotifyProviderAccountId,
                accountProviderAccountId: accountData?.providerAccountId
            }
        })
    } catch (error) {
        console.error('🔍 Debug: Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 