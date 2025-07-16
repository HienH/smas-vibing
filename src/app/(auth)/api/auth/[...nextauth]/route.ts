import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { FirestoreAdapter } from '@next-auth/firebase-adapter'
import type { NextAuthOptions } from 'next-auth'
import { SPOTIFY_CONFIG, API_ENDPOINTS } from '@/lib/constants'
import { adminAdapterConfig } from '@/lib/firebaseAdmin'
import { upsertUser } from '@/services/firebase/users'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { getUserByNextAuthId } from '@/services/firebase/users'
import admin from 'firebase-admin'
import spotifyAuthCallback from '@/mocks/spotify-auth-callback.json'
import { NextRequest } from 'next/server'

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
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'spotify' && user && account.providerAccountId && account.access_token) {
        try {
          // Get Spotify user profile to get the spotifyUserId
          const spotifyUserProfile = await getSpotifyUserProfile(account.access_token)

          // Check if user data already exists in accounts collection
          const existingUser = await getUserByNextAuthId(user.id)
          if (existingUser.success && existingUser.data) {
            return true
          }

          // Do NOT manually upsert user here. Let NextAuth's FirestoreAdapter handle user/account creation and linking.
          // This prevents OAuthAccountNotLinked errors and ensures proper linking.
          // If you need to sync extra user data, do it in an event or after session is established.
          // Example placeholder:
          // await syncExtraUserData(user, spotifyUserProfile, account)

        } catch (error) {
          console.error('❌ Failed to store user data:', error)
          // Don't block sign in if Firestore fails
        }
      } else {
        // console.log('🔍 signIn callback: Missing required data for user storage:', {
        //   hasAccount: !!account,
        //   provider: account?.provider,
        //   hasUser: !!user,
        //   hasProviderAccountId: !!account?.providerAccountId,
        //   hasAccessToken: !!account?.access_token
        // })
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
            id: user.id,
            name: user.name,
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

    async session({ session, token }: { session: Session; token: JWT }) {
      const user = token.user as { name?: string, id?: string } | undefined
      session.user.id = user?.id as string
      session.user.name = user?.name ?? null
        ; (session as any).accessToken = token.accessToken
        ; (session as any).error = token.error
      return session
    },
  },
  events: {
    async signIn(message: any) {
      // console.log('🎉 SignIn event:', message)
    },
    async signOut(message: any) {
      // console.log('👋 SignOut event:', message)
    },
  }
}

// // 🔁 NextAuth API handler
// const handler = NextAuth(authOptions)

// export async function GET(req: NextRequest) {
//   if (process.env.NODE_ENV === 'development') {
//     return new Response(JSON.stringify(spotifyAuthCallback), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     })
//   }
//   return handler(req)
// }

// export { handler as POST }
// 🔁 NextAuth API handler
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }