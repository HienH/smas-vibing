/**
 * @fileoverview Song item component for displaying individual song information.
 *
 * Shows song metadata with contributor attribution in a compact format.
 */
import { useState } from 'react'
import { type Song } from '@/stores/playlist-store'

interface SongItemProps {
  song: Song
}

/**
 * @description Renders a single song item with metadata and contributor information.
 * @param {SongItemProps} props - Props containing the song data.
 * @returns {JSX.Element} The song item component.
 */
export function SongItem({ song }: SongItemProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg w-full">
      {song.imageUrl && !imageError ? (
        <img
          src={song.imageUrl}
          alt={`${song.album} cover`}
          className="w-12 h-12 rounded-md object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center"
          aria-label="No album cover available"
        >
          <span className="text-gray-500 text-xs">🎵</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {song.name}
        </h4>
        <p className="text-sm text-gray-600 truncate">
          {song.artist}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {song.album}
        </p>
      </div>

      {song.contributorName && (
        <div className="flex-shrink-0">
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            aria-label={`Contributed by ${song.contributorName}`}
          >
            {song.contributorName}
          </span>
        </div>
      )}
    </div>
  )
} 