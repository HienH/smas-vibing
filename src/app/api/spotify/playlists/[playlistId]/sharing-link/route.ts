/**
 * @fileoverview API route to get the sharing link for a playlist (server-side, Admin SDK).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSharingLinksByPlaylist } from '@/services/firebase/sharing-links'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ playlistId: string }> }
) {
    const { playlistId } = await params
    if (!playlistId) {
        return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 })
    }
    const result = await getSharingLinksByPlaylist(playlistId)
    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
    }
    const links = result.data || []
    const sharingLink = links[0] || null
    return NextResponse.json({ sharingLink })
} 