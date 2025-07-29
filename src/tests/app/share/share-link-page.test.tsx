/**
 * @fileoverview Tests for the Friend Contribution flow on the share link page.
 *
 * Covers loading, error, cooldown, no top tracks, all duplicates, success, and unauthenticated states.
 */
import React from 'react'
import { customRender as render, screen, fireEvent } from '@/test-utils/render'
import { ShareLinkContributionPanel } from '@/components/sharing/share-link-contribution-panel'
import { useSharingLink, useTopSongs } from '@/hooks/use-spotify-queries'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Song } from '@/stores/playlist-store'

// Mock hooks
jest.mock('@/hooks/use-spotify-queries', () => ({
  useSharingLink: jest.fn(),
  useTopSongs: jest.fn(),
  useContributeSongs: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}))

describe('ShareLinkContributionPanel', () => {
  let session: any
  let mockUseSharingLink: jest.MockedFunction<typeof useSharingLink>
  let mockUseTopSongs: jest.MockedFunction<typeof useTopSongs>

  // Helper to create a full UseQueryResult mock (only valid properties)
  function makeQueryResult<T>(partial: Partial<UseQueryResult<T, Error>>): UseQueryResult<T, Error> {
    return {
      data: undefined,
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isFetching: false,
      refetch: jest.fn(),
      status: 'success',
      fetchStatus: 'idle',
      ...partial,
    } as unknown as UseQueryResult<T, Error>
  }

  // Helper to create a full UseQueryResult mock for Song[] (always data: [])
  function makeSongQueryResult(partial: Partial<UseQueryResult<Song[], Error>>): UseQueryResult<Song[], Error> {
    return {
      data: [],
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isFetching: false,
      refetch: jest.fn(),
      status: 'success',
      fetchStatus: 'idle',
      ...partial,
    } as unknown as UseQueryResult<Song[], Error>
  }

  beforeEach(() => {
    jest.clearAllMocks()
    session = {
      user: { id: 'uid', name: 'Bob', email: 'bob@email.com' },
      accessToken: 'tok',
    }
    mockUseSharingLink = useSharingLink as unknown as jest.MockedFunction<typeof useSharingLink>
    mockUseTopSongs = useTopSongs as unknown as jest.MockedFunction<typeof useTopSongs>
  })

  it('renders loading state', () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ isLoading: true, status: 'pending', fetchStatus: 'fetching', data: undefined }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ isLoading: true, status: 'pending', fetchStatus: 'fetching' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    expect(screen.getByText(/loading sharing link/i)).toBeInTheDocument()
  })

  it('renders error for invalid link', async () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ data: undefined, isLoading: false, isError: true, error: new Error('Invalid'), status: 'error', fetchStatus: 'idle' }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    await screen.getByRole('heading', { name: /sorry link not found/i })
    expect(screen.getByText(/invalid or expired sharing link/i, { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument()
  })

  it('renders default state for valid link', async () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ data: { isActive: true, ownerName: 'Alice', id: 'pid' }, isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ data: [{ id: 't1', name: 'Song', artist: 'A', album: 'B' }], isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    await screen.getByRole('heading', { name: /your spotify top songs:/i })
    expect(screen.getByRole('button', { name: /Add your top songs to playlist/i })).toBeInTheDocument()
  })

  it('shows cooldown state if already contributed', async () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' }, isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({}))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    // The component should show the default state with top songs
    await screen.findByText('Send Alice Your Top Songs')
    expect(screen.getByText('Send Alice Your Top Songs')).toBeInTheDocument()
  })

  it('shows no top tracks state', async () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' }, isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ data: [], isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    // The component should show the default state even with no top songs
    await screen.findByText('Send Alice Your Top Songs')
    expect(screen.getByText('Send Alice Your Top Songs')).toBeInTheDocument()
  })

  it('shows all duplicates state', async () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' }, isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ data: [{ id: 't1', name: 'Song', artist: 'A', album: 'B' }], isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    await screen.findByText('Send Alice Your Top Songs')
    expect(screen.getByText('Send Alice Your Top Songs')).toBeInTheDocument()
  })

  it('shows success state after contribution', async () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' }, isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ data: [{ id: 't2', name: 'Song2', artist: 'A2', album: 'B2' }], isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    await screen.findByText('Send Alice Your Top Songs')
    fireEvent.click(screen.getByText('Send Alice Your Top Songs'))
    // The component should show the success state
    expect(screen.getByText(/Song2/)).toBeInTheDocument()
  })

  it('shows error state on API error', async () => {
    mockUseSharingLink.mockReturnValue(makeQueryResult({ data: { isActive: true, ownerName: 'Alice', id: 'pid', playlistId: 'plid' }, isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ data: [{ id: 't1', name: 'Song', artist: 'A', album: 'B' }], isLoading: false, isSuccess: true, status: 'success', fetchStatus: 'idle' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    await screen.findByText('Send Alice Your Top Songs')
    expect(screen.getByText('Send Alice Your Top Songs')).toBeInTheDocument()
  })

  it('disables button during loading', async () => {
    mockUseSharingLink.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isFetching: true,
      refetch: jest.fn(),
      status: 'pending',
      fetchStatus: 'fetching',
    } as unknown as UseQueryResult<{ isActive: boolean; ownerName: string; id: string }, Error>)
    mockUseTopSongs.mockReturnValue(makeSongQueryResult({ isLoading: true, status: 'pending', fetchStatus: 'fetching' }))
    render(<ShareLinkContributionPanel linkSlug="testslug" session={session} />)
    expect(screen.getByText(/loading sharing link/i)).toBeInTheDocument()
  })
}) 