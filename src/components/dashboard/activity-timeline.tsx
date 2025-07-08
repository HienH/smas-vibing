/**
 * @fileoverview Activity timeline component showing recent playlist contributions.
 *
 * Displays a visual timeline of recent contributions with dates and contributor names.
 */
'use client'

import { useMemo } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { type Contribution } from '@/types/firebase'
import { format } from 'date-fns'

interface ActivityTimelineProps {
  contributions: Contribution[]
}

/**
 * @description Renders an activity timeline showing recent contributions.
 * @param {ActivityTimelineProps} props - Props containing contributions data.
 * @returns {JSX.Element} The activity timeline component.
 */
export function ActivityTimeline({ contributions }: ActivityTimelineProps) {
  // Get recent contributions (last 7)
  const recentContributions = useMemo(() => {
    return contributions
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, 7)
  }, [contributions])

  if (recentContributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No contributions yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentContributions.map((contribution, index) => (
            <div key={contribution.id} className="flex items-start space-x-3">
              {/* Timeline dot */}
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {contribution.contributorName}
                  </p>
                  <span className="text-xs text-gray-500">
                    {format(contribution.createdAt.toDate(), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Added {contribution.tracks.length} track{contribution.tracks.length !== 1 ? 's' : ''}
                </p>
                {contribution.tracks.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    &quot;{contribution.tracks[0].name}&quot; by {contribution.tracks[0].artist}
                    {contribution.tracks.length > 1 && ` +${contribution.tracks.length - 1} more`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {contributions.length > 7 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              +{contributions.length - 7} more contributions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 