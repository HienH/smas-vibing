/**
 * @fileoverview Dashboard page - Main user interface after Spotify authentication.
 *
 * Displays user's SMAS playlist, top 5 songs, sharing link, and contributor management.
 */
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { authOptions } from '@/app/api/auth/[...nextauth]/route' // adjust path if needed

/**
 * @description Renders the dashboard page with authentication check.
 * @returns {Promise<JSX.Element>} The dashboard page or redirect to login.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Check if we have a session at all
  if (!session) {
    redirect('/')
  }

  // For now, let's just check if we have a user object with basic info
  // This indicates the user is authenticated, even if we don't have the ID
  if (!session.user || !session.user.email) {
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <DashboardContent />
    </main>
  )
} 