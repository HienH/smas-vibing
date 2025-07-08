/**
 * @fileoverview Dashboard page - Main user interface after Spotify authentication.
 *
 * Displays user's SMAS playlist, top 5 songs, sharing link, and contributor management.
 */
import { redirect } from 'next/navigation'
import { validateSession } from '@/lib/auth'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

/**
 * @description Renders the dashboard page with authentication check.
 * @returns {Promise<JSX.Element>} The dashboard page or redirect to login.
 */
export default async function DashboardPage() {
  const session = await validateSession()

  if (!session) {
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <DashboardContent session={session} />
    </main>
  )
} 