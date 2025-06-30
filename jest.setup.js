/**
 * @fileoverview Jest setup file for SMAS testing framework.
 *
 * Configures testing libraries and MSW for API mocking.
 */

import '@testing-library/jest-dom'

// Mock Response global for MSW
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.init = init
    this.status = init.status || 200
    this.ok = this.status >= 200 && this.status < 300
  }
  
  json() {
    return Promise.resolve(this.body)
  }
}

// Conditionally import MSW server
let server
try {
  const { server: mswServer } = require('./src/mocks/server')
  server = mswServer
} catch (error) {
  // MSW server not available, skip setup
  server = null
}

// Establish API mocking before all tests
if (server) {
  beforeAll(() => server.listen())
  
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests
  afterEach(() => server.resetHandlers())
  
  // Clean up after the tests are finished
  afterAll(() => server.close())
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
} 