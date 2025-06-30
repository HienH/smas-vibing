/**
 * @fileoverview Unit tests for playlist Zustand store.
 *
 * Tests all store actions and state management.
 */

import { renderHook, act } from '@testing-library/react'
import { usePlaylistStore } from '@/stores/playlist-store'
import { createMockSong, createMockSongs, createMockPlaylist } from '@/test-utils/data-factories'

describe('Playlist Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      usePlaylistStore.getState().reset()
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePlaylistStore())

      expect(result.current.topSongs).toEqual([])
      expect(result.current.playlist).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasError).toBe(false)
    })
  })

  describe('setTopSongs', () => {
    it('should set top songs correctly', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const mockSongs = createMockSongs(3)

      act(() => {
        result.current.setTopSongs(mockSongs)
      })

      expect(result.current.topSongs).toEqual(mockSongs)
    })

    it('should replace existing top songs', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const initialSongs = createMockSongs(2)
      const newSongs = createMockSongs(3)

      act(() => {
        result.current.setTopSongs(initialSongs)
      })

      act(() => {
        result.current.setTopSongs(newSongs)
      })

      expect(result.current.topSongs).toEqual(newSongs)
      expect(result.current.topSongs).not.toEqual(initialSongs)
    })
  })

  describe('setPlaylist', () => {
    it('should set playlist correctly', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const mockPlaylist = createMockPlaylist()

      act(() => {
        result.current.setPlaylist(mockPlaylist)
      })

      expect(result.current.playlist).toEqual(mockPlaylist)
    })

    it('should replace existing playlist', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const initialPlaylist = createMockPlaylist({ id: 'playlist1' })
      const newPlaylist = createMockPlaylist({ id: 'playlist2' })

      act(() => {
        result.current.setPlaylist(initialPlaylist)
      })

      act(() => {
        result.current.setPlaylist(newPlaylist)
      })

      expect(result.current.playlist).toEqual(newPlaylist)
      expect(result.current.playlist?.id).toBe('playlist2')
    })
  })

  describe('addSongsToPlaylist', () => {
    it('should add songs to existing playlist', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const initialPlaylist = createMockPlaylist()
      const newSongs = createMockSongs(2)
      const contributorId = 'user2'

      act(() => {
        result.current.setPlaylist(initialPlaylist)
      })

      act(() => {
        result.current.addSongsToPlaylist(newSongs, contributorId)
      })

      expect(result.current.playlist?.songs).toHaveLength(3) // 1 initial + 2 new
      expect(result.current.playlist?.contributors).toContain(contributorId)
      expect(result.current.playlist?.songs[1].contributorId).toBe(contributorId)
      expect(result.current.playlist?.songs[2].contributorId).toBe(contributorId)
    })

    it('should not add duplicate songs', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const existingSong = createMockSong({ id: 'song1' })
      const playlist = createMockPlaylist({
        songs: [existingSong]
      })
      const duplicateSong = createMockSong({ id: 'song1' })
      const newSong = createMockSong({ id: 'song2' })

      act(() => {
        result.current.setPlaylist(playlist)
      })

      act(() => {
        result.current.addSongsToPlaylist([duplicateSong, newSong], 'user2')
      })

      expect(result.current.playlist?.songs).toHaveLength(2) // 1 existing + 1 new (duplicate filtered out)
      expect(result.current.playlist?.songs.find(s => s.id === 'song1')).toBeDefined()
      expect(result.current.playlist?.songs.find(s => s.id === 'song2')).toBeDefined()
    })

    it('should not add contributor if already exists', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const playlist = createMockPlaylist({
        contributors: ['user1']
      })
      const newSongs = createMockSongs(1)

      act(() => {
        result.current.setPlaylist(playlist)
      })

      act(() => {
        result.current.addSongsToPlaylist(newSongs, 'user1')
      })

      expect(result.current.playlist?.contributors).toEqual(['user1'])
      expect(result.current.playlist?.contributors).toHaveLength(1)
    })

    it('should not modify playlist if no playlist exists', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const newSongs = createMockSongs(2)

      act(() => {
        result.current.addSongsToPlaylist(newSongs, 'user1')
      })

      expect(result.current.playlist).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('should set loading state correctly', () => {
      const { result } = renderHook(() => usePlaylistStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error state correctly', () => {
      const { result } = renderHook(() => usePlaylistStore())

      act(() => {
        result.current.setError(true)
      })

      expect(result.current.hasError).toBe(true)

      act(() => {
        result.current.setError(false)
      })

      expect(result.current.hasError).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => usePlaylistStore())
      const mockSongs = createMockSongs(2)
      const mockPlaylist = createMockPlaylist()

      // Set some state
      act(() => {
        result.current.setTopSongs(mockSongs)
        result.current.setPlaylist(mockPlaylist)
        result.current.setLoading(true)
        result.current.setError(true)
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.topSongs).toEqual([])
      expect(result.current.playlist).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasError).toBe(false)
    })
  })
}) 