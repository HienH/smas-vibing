/**
 * @fileoverview Authentication utilities for NextAuth session and token management.
 *
 * Provides helper functions for validating sessions and extracting tokens.
 */

import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'
import { authOptions } from '@/app/(auth)/api/auth/[...nextauth]/route'

/**
 * @description Validates user session and returns session data.
 * @returns {Promise<any>} The validated session or null.
 */
export async function validateSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  return session
}

/**
 * @description Extracts access token from request for API routes.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<string | null>} The access token or null.
 */
export async function getAccessToken(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET
  })

  return token?.accessToken as string || null
}

/**
 * @description Validates session and access token for API routes.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<{session: any, accessToken: string} | null>} Session and token or null.
 */
export async function validateApiRequest(request: NextRequest) {
  const session = await validateSession()

  if (!session) {
    return null
  }

  const accessToken = await getAccessToken(request)

  if (!accessToken) {
    return null
  }

  return { session, accessToken }
} 