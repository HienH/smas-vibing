/**
 * @fileoverview Session provider component for NextAuth session management.
 *
 * Wraps the NextAuth SessionProvider with additional configuration and error handling.
 */
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: React.ReactNode
}

/**
 * @description Client-side session provider for NextAuth with enhanced configuration.
 * @param {SessionProviderProps} props - Component props.
 * @returns {JSX.Element} The session provider component.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  )
} 