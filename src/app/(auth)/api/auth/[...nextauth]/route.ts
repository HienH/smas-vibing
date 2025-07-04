import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { FirestoreAdapter } from '@next-auth/firebase-adapter'
import type { NextAuthOptions } from 'next-auth'
import type { Session, User } from 'next-auth'
import { SPOTIFY_CONFIG, API_ENDPOINTS } from '@/lib/constants'
import { adminAdapterConfig } from '@/lib/firebaseAdmin'
import { upsertUser } from '@/services/firebase/users'
import { Timestamp } from 'firebase/firestore'

/**
 * @description Refreshes the Spotify access token using the refresh token.
 * @param {string} refreshToken - The refresh token to use.
 * @returns {Promise<any>} The refreshed token data or error.
 */
async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(API_ENDPOINTS.spotify.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    const tokens = await response.json()

    if (!response.ok) {
      console.error('❌ Spotify token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error: tokens.error,
        errorDescription: tokens.error_description
      })
      throw tokens
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? refreshToken,
      accessTokenExpires: Date.now() + tokens.expires_in * 1000,
    }
  } catch (error) {
    console.error('💥 Token refresh error:', error)
    return {
      error: 'RefreshAccessTokenError',
    }
  }
}

/**
 * @description Fetches Spotify user profile from the Spotify API.
 * @param {string} accessToken - Spotify access token.
 * @returns {Promise<any>} Spotify user profile or error.
 */
async function getSpotifyUserProfile(accessToken: string) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('❌ Failed to fetch Spotify user profile:', error)
    throw error
  }
}

/**
 * @description NextAuth configuration for Spotify OAuth with Firebase Admin SDK adapter.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope: SPOTIFY_CONFIG.scopes },
      },
    }),
  ],
  adapter: FirestoreAdapter(adminAdapterConfig),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  debug: true,
  callbacks: {
    async signIn({ user, account }) {
   
      if (account?.provider === 'spotify' && user && account.providerAccountId && account.access_token) {
        try {
          // Get Spotify user profile to get the spotifyUserId
          const spotifyUserProfile = await getSpotifyUserProfile(account.access_token)
          
          // Store user data in Firestore
          const expiresAt = account.expires_at 
            ? Timestamp.fromMillis(account.expires_at * 1000)
            : undefined

          await upsertUser({
            id: user.id,
            spotifyProviderAccountId: account.providerAccountId, // From NextAuth
            spotifyUserId: spotifyUserProfile.id, // From Spotify API
            displayName: user.name ?? '',
            email: user.email ?? '',
            imageUrl: user.image ?? undefined,
            spotifyAccessToken: account.access_token,
            spotifyRefreshToken: account.refresh_token,
            spotifyTokenExpiresAt: expiresAt,
          })
   
        } catch (error) {
          console.error('❌ Failed to store user data:', error)
          // Don't block sign in if Firestore fails
        }
      }
      return true
    },

    async jwt({ token, account, user }) {

      if (account && user) {

        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at! * 1000,
          user: {
            name: user.name,
            email: user.email,
            image: user.image,
          },
          sub: account.providerAccountId,
        }
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      const refreshed = await refreshAccessToken(token.refreshToken as string)

      if ('error' in refreshed) {
        return {
          ...token,
          error: 'RefreshAccessTokenError',
        }
      }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
      }
    },

    async session({ session, token }) {

      const user = token.user as User | undefined

      session.user.id = token.sub as string
      session.user.name = user?.name ?? null
      session.user.email = user?.email ?? null
      session.user.image = user?.image ?? null
      session.accessToken = token.accessToken as string
      ;(session as any).error = token.error


      return session
    },
  },
  events: {
    async signIn(message: any) {
      console.log('🎉 SignIn event:', message)
    },
    async signOut(message: any) {
      console.log('👋 SignOut event:', message)
    },
  }
}

// 🔁 NextAuth API handler
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
