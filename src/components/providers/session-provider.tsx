/**
 * @fileoverview SessionProvider - Client component wrapper for NextAuth SessionProvider.
 *
 * Enables session management throughout the SMAS application.
 */
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: React.ReactNode
}

/**
 * @description Client-side session provider for NextAuth.
 * @param {SessionProviderProps} props - Component props.
 * @returns {JSX.Element} The session provider component.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
} 