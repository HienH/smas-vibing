/**
 * @fileoverview ShareLinkCard - Displays the sharing link and copy functionality.
 *
 * Shows the user's unique sharing link with copy-to-clipboard functionality.
 */
'use client'

import { useState } from 'react'
import { usePlaylistStore } from '@/stores/playlist-store'
import { Button } from '@/components/ui/button'

/**
 * @description Renders the sharing link card with copy functionality.
 * @returns {JSX.Element} The share link card component.
 */
export function ShareLinkCard() {
  const { playlist } = usePlaylistStore()
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = async () => {
    if (!playlist?.shareLink) return

    try {
      await navigator.clipboard.writeText(playlist.shareLink)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  if (!playlist) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Share Your Playlist</h2>
        <p className="text-gray-600">Creating your sharing link...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Share Your Playlist</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Sharing Link
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={playlist.shareLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              {hasCopied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            How it works
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Share this link with your friends</li>
            <li>• They'll add their top 5 songs to your playlist</li>
            <li>• You can contribute back to their playlists too!</li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Friends can contribute once every 4 weeks
          </p>
        </div>
      </div>
    </div>
  )
} 