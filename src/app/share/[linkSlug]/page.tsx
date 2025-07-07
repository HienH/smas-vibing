/**
 * @fileoverview Friend contribution page for sharing link visits.
 *
 * Fetches and validates the sharing link, increments analytics, and renders UI for friend contributions.
 */
'use client'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ShareLinkContributionPanel } from '@/components/sharing/share-link-contribution-panel'

export default function ShareLinkPage() {
  const { linkSlug } = useParams<{ linkSlug: string }>()
  const { data: session } = useSession()

  return (
    <ShareLinkContributionPanel
      linkSlug={linkSlug}
      session={session}
    />
  )
} 