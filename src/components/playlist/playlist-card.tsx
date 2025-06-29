/**
 * @fileoverview PlaylistCard - Displays the user's SMAS playlist with songs and contributors.
 *
 * Shows all songs in the playlist with contributor attribution and playlist management options.
 */
'use client'

import { usePlaylistStore } from '@/stores/playlist-store'
import { SongItem } from './song-item'

/**
 * @description Renders the SMAS playlist card with songs and contributor information.
 * @returns {JSX.Element} The playlist card component.
 */
export function PlaylistCard() {
  const { playlist, isLoading } = usePlaylistStore()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">SMAS Playlist</h2>
        <p className="text-gray-600">No playlist found. Creating your SMAS playlist...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{playlist.name}</h2>
        <span className="text-sm text-gray-500">
          {playlist.songs.length} songs
        </span>
      </div>

      {playlist.songs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">Your playlist is empty</p>
          <p className="text-sm text-gray-500">
            Share your link with friends to start collecting songs!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlist.songs.map((song) => (
            <SongItem key={song.id} song={song} />
          ))}
        </div>
      )}

      {playlist.contributors.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Contributors</h3>
          <div className="flex flex-wrap gap-2">
            {playlist.contributors.map((contributor) => (
              <span
                key={contributor}
                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {contributor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 