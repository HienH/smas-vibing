/**
 * @fileoverview MSW server setup for API mocking in tests.
 *
 * Configures MSW server with handlers for Spotify API and NextAuth endpoints.
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers) 