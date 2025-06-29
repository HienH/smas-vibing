/**
 * @fileoverview Landing page for SMAS - Social music discovery app.
 *
 * Displays app description and Spotify login CTA, redirects authenticated users to dashboard.
 */
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { LoginButton } from '../components/auth/login-button'

/**
 * @description Renders the landing page with authentication check.
 * @returns {Promise<JSX.Element>} The landing page or redirect to dashboard.
 */
export default async function HomePage() {
  const session = await getServerSession()

  // Check if user is authenticated by looking for basic user info
  if (session?.user?.email) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-green-700">Send Me a Song</h1>
        <p className="text-lg text-gray-700 mb-8">
          Discover new music from your friends' favourite song.<br />
          Build your Spotify playlist together.
        </p>
        <LoginButton />
      </div>
    </main>
  )
}
