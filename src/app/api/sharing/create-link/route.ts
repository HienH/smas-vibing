/**
 * @fileoverview API route for creating a new sharing link for a user's playlist.
 *
 * Validates the user session, generates a unique link slug, creates the sharing link in Firestore, and returns the link.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/(auth)/api/auth/[...nextauth]/route'
import { createSharingLink, generateUniqueLinkSlug } from '@/services/firebase/sharing-links'
import { getPlaylistById } from '@/services/firebase/playlists'
import type { CreateSharingLinkData } from '@/types/firebase'

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playlistId, ownerName } = await request.json()
    if (!playlistId) {
      return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 })
    }
    // Use session user name as fallback if ownerName is not provided
    const resolvedOwnerName = ownerName || session.user.name || 'User'

    // Validate playlist exists and belongs to user
    const playlistResult = await getPlaylistById(playlistId)
    if (!playlistResult.success || playlistResult.data?.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid playlist' }, { status: 400 })
    }

    // Generate unique link slug
    const slugResult = await generateUniqueLinkSlug()
    if (!slugResult.success || typeof slugResult.data !== 'string') {
      return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
    }

    // Create sharing link
    const linkData: CreateSharingLinkData = {
      playlistId,
      ownerId: session.user.id,
      ownerName: resolvedOwnerName,
      linkSlug: slugResult.data,
    }
    const linkResult = await createSharingLink(linkData)
    if (!linkResult.success || !linkResult.data) {
      return NextResponse.json({ error: 'Failed to create sharing link' }, { status: 500 })
    }

    return NextResponse.json({ link: `/share/${linkResult.data.linkSlug}` })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 