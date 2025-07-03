/**
 * @fileoverview Dashboard metrics component displaying key playlist statistics.
 *
 * Shows total tracks, unique contributors, recent activity, and share link usage.
 */
'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { type Contribution } from '@/types/firebase'
import { format } from 'date-fns'

interface DashboardMetricsProps {
  contributions: Contribution[]
  totalTracks: number
  shareLinkUsage?: number
}

/**
 * @description Renders dashboard metrics cards with key playlist statistics.
 * @param {DashboardMetricsProps} props - Props containing metrics data.
 * @returns {JSX.Element} The dashboard metrics component.
 */
export function DashboardMetrics({ contributions, totalTracks, shareLinkUsage = 0 }: DashboardMetricsProps) {
  // Calculate unique contributors
  const uniqueContributors = useMemo(() => {
    const contributorIds = new Set(contributions.map(c => c.contributorId))
    return contributorIds.size
  }, [contributions])

  // Get most recent contribution
  const mostRecentContribution = useMemo(() => {
    if (contributions.length === 0) return null
    return contributions.reduce((latest, current) => 
      current.createdAt.toMillis() > latest.createdAt.toMillis() ? current : latest
    )
  }, [contributions])

  // Calculate average tracks per contributor
  const averageTracksPerContributor = useMemo(() => {
    if (uniqueContributors === 0) return 0
    return Math.round((totalTracks / uniqueContributors) * 10) / 10
  }, [totalTracks, uniqueContributors])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Tracks */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-gray-600">Total Tracks</h3>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{totalTracks}</div>
          <p className="text-xs text-gray-500 mt-1">
            {averageTracksPerContributor} avg per contributor
          </p>
        </CardContent>
      </Card>

      {/* Unique Contributors */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-gray-600">Contributors</h3>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{uniqueContributors}</div>
          <p className="text-xs text-gray-500 mt-1">
            {contributions.length} total contributions
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-gray-600">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          {mostRecentContribution ? (
            <>
              <div className="text-2xl font-bold text-green-700">
                {format(mostRecentContribution.createdAt.toDate(), 'MMM d')}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                by {mostRecentContribution.contributorName}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-400">-</div>
              <p className="text-xs text-gray-500 mt-1">No contributions yet</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Share Link Usage */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-gray-600">Link Usage</h3>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{shareLinkUsage}</div>
          <p className="text-xs text-gray-500 mt-1">
            {shareLinkUsage > 0 ? 'visits to your link' : 'No visits yet'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 