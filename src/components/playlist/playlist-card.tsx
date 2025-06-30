/**
 * @fileoverview Playlist card component for displaying user's SMAS playlist.
 *
 * Shows playlist songs with contributor attribution and management options.
 */
'use client'

import { usePlaylistStore } from '@/stores/playlist-store'
import { Card, CardHeader, CardContent, LoadingSpinner } from '@/components/ui'
import { SongItem } from './song-item'

/**
 * @description Renders the SMAS playlist card with songs and contributor information.
 * @returns {JSX.Element} The playlist card component.
 */
export function PlaylistCard() {
  const { playlist, isLoading } = usePlaylistStore()

  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner size="sm" text="Loading playlist..." />
      </Card>
    )
  }

  if (!playlist) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">SMAS Playlist</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No playlist found. Creating your SMAS playlist...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{playlist.name}</h2>
          <span className="text-sm text-gray-500">
            {playlist.songs.length} songs
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {playlist.songs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">Your playlist is empty</p>
            <p className="text-sm text-gray-500">
              Share your link with friends to start collecting their favorite songs!
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
      </CardContent>
    </Card>
  )
} 