/**
 * @fileoverview Landing page for SMAS - Social music discovery app.
 *
 * Displays app description and Spotify login CTA for all users.
 */
import { validateSession } from '@/lib/auth'
import { APP_CONFIG } from '@/lib/constants'
import { LoginButton } from '../components/auth/login-button'

/**
 * @description Renders the landing page with authentication-aware login button.
 * @returns {Promise<JSX.Element>} The landing page with appropriate login button.
 */
export default async function HomePage() {
  const session = await validateSession()

  return (
    <div className="flex text-center justify-center mt-12 bg-green-50">
      <div className="max-w-2xl w-full text-center">
        <p className="text-lg text-gray-700 mb-8">
          "Send Me a Song" lets you discover new music through your friends' favorite tracks.
          Simply share a link with your friends and we’ll create a personalized SMAS playlist on Spotify with their current most-played songs.
        </p>
        <LoginButton hasSession={!!session} />
      </div>
    </div>
  )
}
