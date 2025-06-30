import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import type { NextAuthOptions } from 'next-auth'
import type { Session, User } from 'next-auth'

const scopes = [
  'user-top-read',
  'playlist-modify-public',
  'playlist-read-private',
  'user-read-email',
  'user-library-read',
].join(' ')

/**
 * Refresh the Spotify access token using the refresh token.
 */
async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
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
 * NextAuth configuration for Spotify OAuth.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope: scopes },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
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

      console.log("sessionLOHHHHH")
      console.log(session)

      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// 🔁 NextAuth API handler
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
