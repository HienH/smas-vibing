/**
 * @fileoverview Playlist card component for displaying user's SMAS playlist.
 *
 * Shows playlist songs with contributor attribution and management options.
 */
'use client'

import { Card, CardHeader, CardContent, LoadingState } from '@/components/ui'
import { SongItem } from './song-item'
import { useState, useMemo } from 'react'
import { type Contribution } from '@/types/firebase'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { useSMASPlaylist } from '@/hooks/use-spotify-queries'
import { toDate } from '@/lib/utils';
import { Song } from '@/stores/playlist-store'

interface PlaylistCardProps {
  contributions: Contribution[]
}


/**
 * @description Renders the SMAS playlist card with songs, contributor filter, and contributors list.
 * @param {PlaylistCardProps} props - Props containing contributions array.
 * @returns {JSX.Element} The playlist card component.
 */
export function PlaylistCard({ contributions }: PlaylistCardProps) {
  const { data: playlist, isLoading } = useSMASPlaylist()

  // Build a map from track ID to contributor name
  const trackIdToContributor: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    contributions.forEach(contribution => {
      contribution.spotifyTrackUris.forEach(uri => {
        const match = uri.match(/^spotify:track:(.+)$/);
        if (match) {
          map[match[1]] = contribution.contributorName;
        }
      });
    });
    return map;
  }, [contributions]);

  const [selectedContributor, setSelectedContributor] = useState<string | null>(null)

  // Filtered songs from Spotify playlist
  const filteredSongs = useMemo(() => {
    if (!playlist?.songs) return [];
    let songs = playlist.songs.map((song: { id: string | number }) => ({
      ...song,
      contributorName: trackIdToContributor[song.id],
    }));
    if (selectedContributor) {
      songs = songs.filter((song: { contributorName: string }) => song.contributorName === selectedContributor);
    }
    return songs;
  }, [playlist, trackIdToContributor, selectedContributor]);

  // Build unique contributors list from contributions
  const contributors = useMemo(() => {
    const contributionList = contributions.map(c => ({
      id: c.contributorId,
      name: c.contributorName,
      date: c.createdAt,
    }))
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
    return [...contributionList];
  }, [contributions]);

  if (isLoading) {
    return (
      <Card>
        <LoadingState isLoading={true} text="Loading playlist..." size="sm" />
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
          <span className="text-sm text-gray-500">{filteredSongs.length} songs</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Contributor Filter Dropdown */}
        <div className="mb-4 flex items-center gap-2">
          Filter by contributors:
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
        {filteredSongs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">
              {selectedContributor
                ? "No songs found for this contributor."
                : "No songs in your playlist yet."}
            </p>
            <p className="text-sm text-gray-500">
              {selectedContributor
                ? "This contributor hasn't added any songs yet."
                : "Share your link with friends to start collecting their favorite songs!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSongs.map((song: Song) => (
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
                  {contributor.date && (
                    <span className="text-xs text-gray-500">
                      {format(toDate(contributor.date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 