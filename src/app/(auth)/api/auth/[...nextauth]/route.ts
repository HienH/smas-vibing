import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { FirestoreAdapter } from '@next-auth/firebase-adapter'
import type { NextAuthOptions } from 'next-auth'
import { SPOTIFY_CONFIG, API_ENDPOINTS } from '@/lib/constants'
import { adminAdapterConfig } from '@/lib/firebaseAdmin'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { getUserByNextAuthId, getUserBySpotifyId, updateUserProfile, updateUserWithSpotifyProfile } from '@/services/firebase/users'


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
        return true

      }
      return false
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
    async linkAccount({ user, account }) {
      if (user.id && account.access_token) {
        const spotifyUserProfile = await getSpotifyUserProfile(account.access_token)
        const existingUser = await getUserByNextAuthId(user.id)
        if (existingUser.success && existingUser.data) {
          const userProfileUpdate = {
            displayName: spotifyUserProfile.display_name,
            spotifyUserId: spotifyUserProfile.id,
            updatedAt: new Date().toISOString(),
          }
          await updateUserWithSpotifyProfile(user.id, userProfileUpdate)
        }
      }
    }
  },
}




// events: {
//   async linkAccount({ user, account, profile }) {
//     // Get Spotify user profile to get the spotifyUserId
//     console.log(user.id)
//     console.log("in LINKERD FUCKIGN ACCOUNT")

//     console.log(account.userId)
//     console.log("account.userId in LINKERD FUCKIGN ACCOUNT")

//     const spotifyUserProfile = await getSpotifyUserProfile(user.id)

//     // Check if user data already exists in accounts collection
//     const existingUser = await getUserByNextAuthId(account.userId)
//     if (existingUser.success && existingUser.data) {
//       if (account.provider === 'spotify') {
//         const userProfileUpdate = {
//           spotifyId: profile.id,
//           displayName: profile.display_name,
//           email: profile.email,
//           imageUrl: profile.images?.[0]?.url,
//           updatedAt: new Date().toISOString(),
//         }
//         await updateUserWithSpotifyProfile(user.id, userProfileUpdate)
//         return true
//       }



//     }
//   }
// },

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }