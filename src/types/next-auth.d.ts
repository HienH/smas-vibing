/**
 * @fileoverview NextAuth type declarations - Extends NextAuth types for SMAS.
 *
 * Adds user ID, access token, and other custom properties to the NextAuth session and user types.
 */
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    accessToken?: string
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    sub?: string
  }
} 