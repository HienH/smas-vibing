/**
 * @fileoverview Data factories for generating test data.
 *
 * Provides factory functions for creating consistent test data.
 */

import type { Song, Playlist } from '@/stores/playlist-store'

/**
 * @description Creates a mock song with optional overrides.
 */
export function createMockSong(overrides: Partial<Song> = {}): Song {
  return {
    id: `song-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    imageUrl: 'https://example.com/image.jpg',
    ...overrides,
  }
}

/**
 * @description Creates a mock playlist with optional overrides.
 */
export function createMockPlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: `playlist-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Playlist',
    songs: [createMockSong()],
    contributors: ['user1'],
    shareLink: 'https://smas.app/share/test-playlist',
    ...overrides,
  }
}

/**
 * @description Creates an array of mock songs.
 */
export function createMockSongs(count: number = 5): Song[] {
  return Array.from({ length: count }, (_, index) =>
    createMockSong({
      id: `song-${index + 1}`,
      name: `Test Song ${index + 1}`,
      artist: `Test Artist ${index + 1}`,
      album: `Test Album ${index + 1}`,
    })
  )
}

/**
 * @description Creates a mock Spotify API response for top tracks.
 */
export function createMockSpotifyTopTracks(count: number = 5) {
  return {
    items: Array.from({ length: count }, (_, index) => ({
      id: `spotify-track-${index + 1}`,
      name: `Spotify Song ${index + 1}`,
      artists: [{ name: `Spotify Artist ${index + 1}` }],
      album: {
        name: `Spotify Album ${index + 1}`,
        images: [{ url: `https://example.com/spotify-image-${index + 1}.jpg` }]
      },
      external_urls: { spotify: `https://open.spotify.com/track/${index + 1}` }
    }))
  }
}

/**
 * @description Creates a mock session with optional overrides.
 */
export function createMockSession(overrides: any = {}) {
  return {
    user: {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg'
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
    accessToken: 'mock-access-token',
    ...overrides,
  }
} 