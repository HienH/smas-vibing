/**
 * @fileoverview Playlist card component for displaying user's SMAS playlist.
 *
 * Shows playlist songs with contributor attribution and management options.
 */
'use client'

import { usePlaylistStore } from '@/stores/playlist-store'
import { Card, CardHeader, CardContent, LoadingSpinner } from '@/components/ui'
import { SongItem } from './song-item'
import { useState, useMemo } from 'react'
import { type Contribution } from '@/types/firebase'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'

interface PlaylistCardProps {
  contributions: Contribution[]
}

/**
 * @description Renders the SMAS playlist card with songs, contributor filter, and contributors list.
 * @param {PlaylistCardProps} props - Props containing contributions array.
 * @returns {JSX.Element} The playlist card component.
 */
export function PlaylistCard({ contributions }: PlaylistCardProps) {
  const { playlist, isLoading } = usePlaylistStore()

  // Aggregate all tracks with contributor attribution
  const allTracks = useMemo(() => {
    const tracks = contributions.flatMap(contribution =>
      contribution.tracks.map(track => ({
        ...track,
        id: track.spotifyTrackId,
        album: track.album || '',
        contributorName: contribution.contributorName,
        contributorId: contribution.contributorId,
        contributedAt: contribution.createdAt,
      }))
    )
    return tracks
  }, [contributions])

  // Build unique contributors list
  const contributors = useMemo(() => {
    const list = contributions.map(c => ({
      id: c.contributorId,
      name: c.contributorName,
      date: c.createdAt,
    }))
      .sort((a, b) => b.date.toMillis() - a.date.toMillis())
    return list
  }, [contributions])

  const [selectedContributor, setSelectedContributor] = useState<string | null>(null)

  // Filter tracks by selected contributor
  const filteredTracks = useMemo(() => {
    if (!selectedContributor) return allTracks
    return allTracks.filter(track => track.contributorId === selectedContributor)
  }, [allTracks, selectedContributor])

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
          <h2 className="text-xl font-semibold text-gray-800">SMAS Playlist</h2>
          <span className="text-sm text-gray-500">{filteredTracks.length} songs</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Contributor Filter Dropdown */}
        <div className="mb-4 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Filter playlist by contributor"
              >
                {selectedContributor
                  ? contributors.find(c => c.id === selectedContributor)?.name || 'Contributor'
                  : 'All contributors'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={() => setSelectedContributor(null)}>
                All contributors
              </DropdownMenuItem>
              {contributors.map(contributor => (
                <DropdownMenuItem
                  key={contributor.id}
                  onSelect={() => setSelectedContributor(contributor.id)}
                >
                  {contributor.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Playlist Tracks */}
        {filteredTracks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No songs found for this contributor.</p>
            <p className="text-sm text-gray-500">
              Share your link with friends to start collecting their favorite songs!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTracks.map((song) => (
              <SongItem key={song.id} song={song} />
            ))}
          </div>
        )}

        {/* Contributors List */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Contributors</h3>
          <div className="flex flex-col gap-2">
            {contributors.length === 0 ? (
              <span className="text-xs text-gray-500">No contributors yet.</span>
            ) : (
              contributors.map(contributor => (
                <div key={contributor.id} className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {contributor.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(contributor.date.toDate(), 'MMM d, yyyy, h:mm a')}
                </span>
            </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 