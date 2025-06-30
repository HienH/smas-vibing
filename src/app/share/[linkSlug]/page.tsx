/**
 * @fileoverview Friend contribution page for sharing link visits.
 *
 * Fetches and validates the sharing link, increments analytics, and renders UI for friend contributions.
 */
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, Button, LoadingSpinner } from '@/components/ui'
import { useFirebase } from '@/hooks/use-firebase'

interface SharingLinkState {
  isLoading: boolean
  isValid: boolean
  ownerName?: string
  error?: string
}

export default function ShareLinkPage() {
  const { linkSlug } = useParams<{ linkSlug: string }>()
  const router = useRouter()
  const { getSharingLink, trackLinkUsage } = useFirebase()
  const [state, setState] = useState<SharingLinkState>({ isLoading: true, isValid: false })

  useEffect(() => {
    let isMounted = true
    const fetchLink = async () => {
      if (!linkSlug) return
      setState({ isLoading: true, isValid: false })
      const result = await getSharingLink(linkSlug)
      if (!isMounted) return
      if (result.success && result.data?.isActive) {
        setState({ isLoading: false, isValid: true, ownerName: result.data.ownerName })
        // Increment analytics
        trackLinkUsage(result.data.id)
      } else {
        setState({ isLoading: false, isValid: false, error: 'Invalid or expired sharing link.' })
      }
    }
    fetchLink()
    return () => { isMounted = false }
  }, [linkSlug, getSharingLink, trackLinkUsage])

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading sharing link..." />
      </div>
    )
  }

  if (!state.isValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-red-700">Link Not Found</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">{state.error || 'This sharing link is invalid or has expired.'}</p>
            <Button onClick={() => router.push('/')} aria-label="Go to home">Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-green-700">Send Your Top Songs to {state.ownerName}</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-700">
              You can contribute your top 5 Spotify songs to {state.ownerName}&apos;s SMAS playlist.
            </p>
            <Button
              onClick={() => {/* TODO: Add contribution logic */}}
              aria-label="Add Your Top Songs"
              className="w-full"
            >
              Add Your Top Songs
            </Button>
            <div className="text-center text-sm text-gray-500 mt-4">
              You&apos;ll be asked to log in with Spotify if you haven&apos;t already.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 