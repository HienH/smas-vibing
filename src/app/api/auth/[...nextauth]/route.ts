/**
 * @fileoverview NextAuth API route for Spotify OAuth authentication.
 *
 * Handles user login, session, and callback logic for SMAS using Spotify as the provider.
 */
import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import type { NextAuthOptions } from 'next-auth'

const scopes = [
  'user-top-read',
  'playlist-modify-public',
  'playlist-read-private',
  'user-read-email',
  'user-library-read',
].join(' ')

/**
 * @description Refreshes the Spotify access token using the refresh token.
 * @param {string} refreshToken - The refresh token to use.
 * @returns {Promise<any>} The new token response.
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
 * @description NextAuth configuration for Spotify OAuth.
 */
const handler = NextAuth({
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
      // Initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at! * 1000,
          user,
          sub: account.providerAccountId,
        }
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token.refreshToken as string)
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.id = token.sub as string
      session.accessToken = token.accessToken as string
      ;(session as any).error = token.error as string

      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
} as NextAuthOptions)

export { handler as GET, handler as POST } 