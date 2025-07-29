/**
 * @fileoverview API route to get all contributions for a playlist (server-side, Admin SDK).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getContributionsByPlaylist } from '@/services/firebase/contributions'


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ playlistId: string }> }
) {
    const { playlistId } = await params
    if (!playlistId) {
        return NextResponse.json({ error: 'Missing playlistId' }, { status: 400 })
    }
    const result = await getContributionsByPlaylist(playlistId)
    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Serialize timestamps
    const serializeContribution = (contribution: any) => ({
        ...contribution,
        createdAt: contribution.createdAt?.toDate
            ? contribution.createdAt.toDate().toISOString()
            : contribution.createdAt,
        expiresAt: contribution.expiresAt?.toDate
            ? contribution.expiresAt.toDate().toISOString()
            : contribution.expiresAt,
    });
    const serialized = result.data?.map(serializeContribution);

    return NextResponse.json({ contributions: serialized })
} 