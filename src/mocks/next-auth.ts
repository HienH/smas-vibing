/**
 * @fileoverview Mock data for NextAuth responses in tests.
 *
 * Provides realistic mock data for authentication endpoints.
 */

export const mockAuthData = {
  session: {
    user: {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg'
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
    accessToken: 'mock-access-token'
  },

  token: {
    sub: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: Date.now() + 3600000
  },

  user: {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg'
  }
} 