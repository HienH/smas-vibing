/**
 * @fileoverview Playlist store - Zustand state management for playlist data.
 *
 * Manages user's top 5 songs, SMAS playlist, contributors, and loading states.
 */
import { create } from 'zustand'

export interface Song {
  id: string
  name: string
  artist: string
  album: string
  imageUrl?: string
  contributorName?: string
}

export interface Playlist {
  id: string
  name: string
  songs: Song[]
  contributors: string[]
  shareLink: string
  firestoreId?: string
}

interface PlaylistState {
  // State
  topSongs: Song[]
  playlist: Playlist | null
  isLoading: boolean
  hasError: boolean
  
  // Actions
  setTopSongs: (songs: Song[]) => void
  setPlaylist: (playlist: Playlist) => void
  addSongsToPlaylist: (songs: Song[], contributorId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: boolean) => void
  reset: () => void
}

/**
 * @description Zustand store for playlist state management.
 */
export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  // Initial state
  topSongs: [],
  playlist: null,
  isLoading: false,
  hasError: false,

  // Actions
  setTopSongs: (songs) => set({ topSongs: songs }),
  
  setPlaylist: (playlist) => set({ playlist }),
  
  addSongsToPlaylist: (songs, contributorId) => {
    const { playlist } = get()
    if (!playlist) return

    const existingSongs = new Set(playlist.songs.map(song => song.id))
    const newSongs = songs.filter(song => !existingSongs.has(song.id))
    
    const updatedPlaylist = {
      ...playlist,
      songs: [...playlist.songs, ...newSongs.map(song => ({ ...song, contributorId }))],
      contributors: playlist.contributors.includes(contributorId) 
        ? playlist.contributors 
        : [...playlist.contributors, contributorId]
    }
    
    set({ playlist: updatedPlaylist })
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ hasError: error }),
  
  reset: () => set({ 
    topSongs: [], 
    playlist: null, 
    isLoading: false, 
    hasError: false 
  })
})) 