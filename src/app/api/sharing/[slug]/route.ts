/**
 * @fileoverview API route for fetching sharing link data by slug.
 *
 * Retrieves sharing link information for public access without authentication.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSharingLinkBySlug } from '@/services/firebase/sharing-links'

export async function GET(
    request: NextRequest,
    { params }: any
) {
    try {
        const { slug } = params

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
        }

        const linkResult = await getSharingLinkBySlug(slug)

        if (!linkResult.success || !linkResult.data) {
            return NextResponse.json({ error: 'Sharing link not found' }, { status: 404 })
        }

        // Return public link data (excluding sensitive information)
        return NextResponse.json({
            linkSlug: linkResult.data.linkSlug,
            ownerName: linkResult.data.ownerName,
            playlistId: linkResult.data.playlistId,
            isActive: linkResult.data.isActive,
            createdAt: linkResult.data.createdAt,
        })
    } catch (error) {
        console.error('Error fetching sharing link:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 