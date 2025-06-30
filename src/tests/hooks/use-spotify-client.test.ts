/**
 * @fileoverview Unit tests for useSpotifyClient custom hook.
 *
 * Tests hook logic with mocked API responses and session management.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpotifyClient } from '@/hooks/use-spotify-client'
import { mockSpotifyData } from '@/mocks/spotify-api'
import { createMockSession } from '@/test-utils/data-factories'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

// Mock the playlist store
jest.mock('@/stores/playlist-store', () => ({
  usePlaylistStore: jest.fn()
}))

import { useSession } from 'next-auth/react'
import { usePlaylistStore } from '@/stores/playlist-store'

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUsePlaylistStore = usePlaylistStore as jest.MockedFunction<typeof usePlaylistStore>

// Mock fetch globally
global.fetch = jest.fn()

describe('useSpotifyClient', () => {
  const mockSetTopSongs = jest.fn()
  const mockSetPlaylist = jest.fn()
  const mockSetLoading = jest.fn()
  const mockSetError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUsePlaylistStore.mockReturnValue({
      setTopSongs: mockSetTopSongs,
      setPlaylist: mockSetPlaylist,
      setLoading: mockSetLoading,
      setError: mockSetError,
      topSongs: [],
      playlist: null,
      isLoading: false,
      hasError: false,
      addSongsToPlaylist: jest.fn(),
      reset: jest.fn()
    })
  })

  describe('fetchTopSongs', () => {
    it('should fetch top songs successfully', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
        update: jest.fn()
      })

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpotifyData.topSongs)
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.fetchTopSongs()
      })

      expect(mockSetLoading).toHaveBeenCalledWith(true)
      expect(mockSetError).toHaveBeenCalledWith(false)
      expect(fetch).toHaveBeenCalledWith('/api/spotify/users/top-songs')
      expect(mockSetTopSongs).toHaveBeenCalledWith(mockSpotifyData.topSongs)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })

    it('should handle 401 error and redirect to login', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
        update: jest.fn()
      })

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        ok: false
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.fetchTopSongs()
      })

      expect(mockSetLoading).toHaveBeenCalledWith(false)
      // Note: window.location.href assignment is tested in integration tests
    })

    it('should handle API errors', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
        update: jest.fn()
      })

      const errorMessage = 'Failed to fetch top songs'
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: errorMessage })
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.fetchTopSongs()
      })

      expect(mockSetError).toHaveBeenCalledWith(true)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })

    it('should not fetch if no session exists', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.fetchTopSongs()
      })

      expect(fetch).not.toHaveBeenCalled()
      expect(mockSetLoading).not.toHaveBeenCalled()
    })
  })

  describe('createPlaylist', () => {
    it('should create playlist successfully', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
        update: jest.fn()
      })

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpotifyData.smasPlaylist)
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.createPlaylist()
      })

      expect(mockSetLoading).toHaveBeenCalledWith(true)
      expect(mockSetError).toHaveBeenCalledWith(false)
      expect(fetch).toHaveBeenCalledWith('/api/spotify/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(mockSetPlaylist).toHaveBeenCalledWith(mockSpotifyData.smasPlaylist)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })

    it('should handle 401 error and redirect to login', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
        update: jest.fn()
      })

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        ok: false
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.createPlaylist()
      })

      expect(mockSetLoading).toHaveBeenCalledWith(false)
      // Note: window.location.href assignment is tested in integration tests
    })

    it('should handle API errors', async () => {
      mockUseSession.mockReturnValue({
        data: createMockSession(),
        status: 'authenticated',
        update: jest.fn()
      })

      const errorMessage = 'Failed to create playlist'
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: errorMessage })
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.createPlaylist()
      })

      expect(mockSetError).toHaveBeenCalledWith(true)
      expect(mockSetLoading).toHaveBeenCalledWith(false)
    })

    it('should not create playlist if no session exists', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      })

      const { result } = renderHook(() => useSpotifyClient())

      await act(async () => {
        await result.current.createPlaylist()
      })

      expect(fetch).not.toHaveBeenCalled()
      expect(mockSetLoading).not.toHaveBeenCalled()
    })
  })
}) 