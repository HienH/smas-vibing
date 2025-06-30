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
      throw tokens
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? refreshToken,
      accessTokenExpires: Date.now() + tokens.expires_in * 1000,
    }
  } catch (error) {
    return {
      error: 'RefreshAccessTokenError',
    }
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
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'spotify' && user) {
        try {
          // Store user data in Firestore
          const expiresAt = account.expires_at 
            ? Timestamp.fromMillis(account.expires_at * 1000)
            : undefined

          await upsertUser({
            id: user.id,
            displayName: user.name ?? '',
            email: user.email ?? '',
            imageUrl: user.image ?? undefined,
            spotifyAccessToken: account.access_token,
            spotifyRefreshToken: account.refresh_token,
            spotifyTokenExpiresAt: expiresAt,
          })
        } catch (error) {
          console.error('Failed to store user data:', error)
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
  debug: process.env.NODE_ENV === 'development',
}

// 🔁 NextAuth API handler
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
