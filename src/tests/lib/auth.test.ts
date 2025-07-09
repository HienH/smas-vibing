/**
 * @fileoverview Unit tests for authentication utilities.
 *
 * Tests session validation and token extraction functions.
 */

import { validateSession, getAccessToken, validateApiRequest } from '@/lib/auth'
import { mockAuthData } from '@/mocks/next-auth'

// Mock NextAuth modules
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn()
}))

jest.mock('@/app/(auth)/api/auth/[...nextauth]/route', () => ({
  authOptions: {}
}))

import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateSession', () => {
    it('should return session when valid session exists', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockAuthData.session)

      const result = await validateSession()

      expect(mockGetServerSession).toHaveBeenCalledWith({})
      expect(result).toEqual(mockAuthData.session)
    })

    it('should return null when no session exists', async () => {
      mockGetServerSession.mockResolvedValueOnce(null)

      const result = await validateSession()

      expect(result).toBeNull()
    })

    it('should return null when session has no user id', async () => {
      const invalidSession = { ...mockAuthData.session, user: { ...mockAuthData.session.user, id: null } }
      mockGetServerSession.mockResolvedValueOnce(invalidSession)

      const result = await validateSession()

      expect(result).toBeNull()
    })
  })

  describe('getAccessToken', () => {
    it('should return access token when valid token exists', async () => {
      const mockRequest = {} as any
      mockGetToken.mockResolvedValueOnce(mockAuthData.token)

      const result = await getAccessToken(mockRequest)

      expect(mockGetToken).toHaveBeenCalledWith({
        req: mockRequest,
        secret: process.env.NEXTAUTH_SECRET
      })
      expect(result).toBe(mockAuthData.token.accessToken)
    })

    it('should return null when no token exists', async () => {
      const mockRequest = {} as any
      mockGetToken.mockResolvedValueOnce(null)

      const result = await getAccessToken(mockRequest)

      expect(result).toBeNull()
    })

    it('should return null when token has no access token', async () => {
      const mockRequest = {} as any
      const tokenWithoutAccess = { ...mockAuthData.token, accessToken: undefined }
      mockGetToken.mockResolvedValueOnce(tokenWithoutAccess)

      const result = await getAccessToken(mockRequest)

      expect(result).toBeNull()
    })
  })

  describe('validateApiRequest', () => {
    it('should return session and access token when both are valid', async () => {
      const mockRequest = {} as any
      mockGetServerSession.mockResolvedValueOnce(mockAuthData.session)
      mockGetToken.mockResolvedValueOnce(mockAuthData.token)

      const result = await validateApiRequest(mockRequest)

      expect(result).toEqual({
        session: mockAuthData.session,
        accessToken: mockAuthData.token.accessToken
      })
    })

    it('should return null when no session exists', async () => {
      const mockRequest = {} as any
      mockGetServerSession.mockResolvedValueOnce(null)

      const result = await validateApiRequest(mockRequest)

      expect(result).toBeNull()
    })

    it('should return null when no access token exists', async () => {
      const mockRequest = {} as any
      mockGetServerSession.mockResolvedValueOnce(mockAuthData.session)
      mockGetToken.mockResolvedValueOnce(null)

      const result = await validateApiRequest(mockRequest)

      expect(result).toBeNull()
    })
  })
}) 