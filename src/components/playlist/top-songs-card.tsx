/**
 * @fileoverview Top songs card component for displaying user's top 5 songs.
 *
 * Shows the user's personal top tracks that form the basis of their SMAS playlist.
 */
'use client'

import { usePlaylistStore } from '@/stores/playlist-store'
import { Card, CardHeader, CardContent, LoadingSpinner } from '@/components/ui'
import { SongItem } from './song-item'

/**
 * @description Renders the user's top 5 songs card.
 * @returns {JSX.Element} The top songs card component.
 */
export function TopSongsCard() {
  const { topSongs, isLoading } = usePlaylistStore()

  if (isLoading) {
    return (
      <Card>
        <LoadingSpinner size="sm" text="Loading top songs..." />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-800">Your Top 5 Songs</h2>
      </CardHeader>
      
      <CardContent>
        {topSongs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No top songs found</p>
            <p className="text-sm text-gray-500">
              Listen to more music on Spotify to generate your top tracks
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topSongs.map((song, index) => (
              <div key={song.id} className="flex items-center space-x-3">
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