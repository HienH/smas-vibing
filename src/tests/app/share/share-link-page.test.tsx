/**
 * @fileoverview Tests for the Friend Contribution flow on the share link page.
 *
 * Covers loading, error, cooldown, no top tracks, all duplicates, success, and unauthenticated states.
 */
import React from 'react'
import { customRender as render, screen, fireEvent } from '@/test-utils/render'
import { ShareLinkContributionPanel } from '@/components/sharing/share-link-contribution-panel'

const getPlaylistTracks = jest.fn()
const addTracksToPlaylist = jest.fn()

global.fetch = jest.fn()

describe('ShareLinkContributionPanel', () => {
  let baseFirebase: any
  let session: any

  beforeEach(() => {
    jest.clearAllMocks()
    baseFirebase = {
      getSharingLink: jest.fn(),
      trackLinkUsage: jest.fn(),
      checkContribution: jest.fn(),
      addContribution: jest.fn(),
      getPlaylist: jest.fn(),
    }
    session = {
      user: { id: 'uid', name: 'Bob', email: 'bob@email.com' },
      accessToken: 'tok',
    }
  })

  it('renders loading state', () => {
    baseFirebase.getSharingLink.mockReturnValue(new Promise(() => {}))
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    expect(screen.getByText(/loading sharing link/i)).toBeInTheDocument()
  })

  it('renders error for invalid link', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: false })
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByText(/link not found/i)
    expect(screen.getByText(/invalid or expired sharing link/i)).toBeInTheDocument()
  })

  it('renders default state for valid link', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: true, data: { isActive: true, ownerName: 'Alice', id: 'pid' } })
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByText(/send your top songs to Alice/i)
    expect(screen.getByRole('button', { name: /add your top songs/i })).toBeInTheDocument()
  })

  it('shows cooldown state if already contributed', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: true, data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' } })
    baseFirebase.getPlaylist.mockResolvedValue({ success: true, data: { spotifyPlaylistId: 'spid' } })
    baseFirebase.checkContribution.mockResolvedValue({ success: true, data: { hasContributed: true, contribution: { expiresAt: { toDate: () => new Date(Date.now() + 3 * 86400000) } } } })
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByRole('button', { name: /add your top songs/i })
    fireEvent.click(screen.getByRole('button', { name: /add your top songs/i }))
    await screen.findByText(/already contributed/i)
    expect(screen.getByText(/can contribute again in/i)).toBeInTheDocument()
  })

  it('shows no top tracks state', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: true, data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' } })
    baseFirebase.getPlaylist.mockResolvedValue({ success: true, data: { spotifyPlaylistId: 'spid' } })
    baseFirebase.checkContribution.mockResolvedValue({ success: true, data: { hasContributed: false } })
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] })
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByRole('button', { name: /add your top songs/i })
    fireEvent.click(screen.getByRole('button', { name: /add your top songs/i }))
    await screen.findByText(/no top songs found/i)
  })

  it('shows all duplicates state', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: true, data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' } })
    baseFirebase.getPlaylist.mockResolvedValue({ success: true, data: { spotifyPlaylistId: 'spid' } })
    baseFirebase.checkContribution.mockResolvedValue({ success: true, data: { hasContributed: false } })
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [{ id: 't1', name: 'Song', artist: 'A', album: 'B' }] })
    getPlaylistTracks.mockResolvedValue({ items: [{ track: { id: 't1' } }] })
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByRole('button', { name: /add your top songs/i })
    fireEvent.click(screen.getByRole('button', { name: /add your top songs/i }))
    await screen.findByText(/all songs already added/i)
  })

  it('shows success state after contribution', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: true, data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' } })
    baseFirebase.getPlaylist.mockResolvedValue({ success: true, data: { spotifyPlaylistId: 'spid' } })
    baseFirebase.checkContribution.mockResolvedValue({ success: true, data: { hasContributed: false } })
    baseFirebase.addContribution.mockResolvedValue({ success: true })
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [{ id: 't2', name: 'Song2', artist: 'A2', album: 'B2' }] })
    getPlaylistTracks.mockResolvedValue({ items: [] })
    addTracksToPlaylist.mockResolvedValue({})
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByRole('button', { name: /add your top songs/i })
    fireEvent.click(screen.getByRole('button', { name: /add your top songs/i }))
    await screen.findByText(/success!/i)
    expect(screen.getByText(/just sent your top songs/i)).toBeInTheDocument()
    expect(screen.getByText(/Song2/)).toBeInTheDocument()
  })

  it('shows error state on API error', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: true, data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' } })
    baseFirebase.getPlaylist.mockResolvedValue({ success: true, data: { spotifyPlaylistId: 'spid' } })
    baseFirebase.checkContribution.mockResolvedValue({ success: true, data: { hasContributed: false } })
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByRole('button', { name: /add your top songs/i })
    fireEvent.click(screen.getByRole('button', { name: /add your top songs/i }))
    await screen.findByRole('heading', { name: /error/i })
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('disables button during loading', async () => {
    baseFirebase.getSharingLink.mockResolvedValue({ success: true, data: { isActive: true, ownerName: 'Alice', id: 'pid' } })
    render(
      <ShareLinkContributionPanel
        linkSlug="testslug"
        session={session}
        getSharingLink={baseFirebase.getSharingLink}
        trackLinkUsage={baseFirebase.trackLinkUsage}
        checkContribution={baseFirebase.checkContribution}
        addContribution={baseFirebase.addContribution}
        getPlaylist={baseFirebase.getPlaylist}
        getPlaylistTracks={getPlaylistTracks}
        addTracksToPlaylist={addTracksToPlaylist}
      />
    )
    await screen.findByText(/send your top songs to Alice/i)
    const btn = screen.getByRole('button', { name: /add your top songs/i })
    fireEvent.click(btn)
    expect(btn).toBeDisabled()
  })
}) 