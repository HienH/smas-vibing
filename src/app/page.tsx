/**
 * @fileoverview Landing page for SMAS - Social music discovery app.
 *
 * Displays app description and Spotify login CTA, redirects authenticated users to dashboard.
 */
import { redirect } from 'next/navigation'
import { validateSession } from '@/lib/auth'
import { APP_CONFIG } from '@/lib/constants'
import { LoginButton } from '../components/auth/login-button'

/**
 * @description Renders the landing page with authentication check.
 * @returns {Promise<JSX.Element>} The landing page or redirect to dashboard.
 */
export default async function HomePage() {
  const session = await validateSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className=" flex text-center justify-center mt-12 bg-green-50">
      <div className="max-w-lg w-full text-center">
        <p className="text-lg text-gray-700 mb-8">
          {APP_CONFIG.description}<br />
          Build your Spotify playlist together.
        </p>
        <LoginButton />
      </div>
    </div>
  )
}
