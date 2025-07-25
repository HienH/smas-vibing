/**
 * @fileoverview Top songs card component for displaying user's top 5 songs.
 *
 * Shows the user's personal top tracks for display purposes only.
 */
'use client'

import { Card, CardHeader, CardContent, LoadingState } from '@/components/ui'
import { SongItem } from './song-item'
import type { Song } from '@/stores/playlist-store'

interface TopSongsCardProps {
  songs: Song[]
  isLoading?: boolean
}

/**
 * @description Renders the user's top 5 songs card.
 * @param {TopSongsCardProps} props - Component props.
 * @returns {JSX.Element} The top songs card component.
 */
export function TopSongsCard({ songs, isLoading = false }: TopSongsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <LoadingState isLoading={true} text="Loading top songs..." size="sm" />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-800">Your Top 5 Songs</h2>
      </CardHeader>

      <CardContent>
        {songs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No top songs found</p>
            <p className="text-sm text-gray-500">
              Listen to more music on Spotify to generate your top tracks
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song: Song, index: number) => (
              <div key={song.id} className="flex items-center space-x-3 ">
                <span
                  className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-medium"
                  aria-label={`Rank ${index + 1}`}
                >
                  {index + 1}
                </span>
                <SongItem song={song} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 