"use client"
/**
 * @fileoverview Login button component for Spotify OAuth authentication.
 *
 * Handles user authentication flow with proper error handling and loading states.
 */
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui'

interface LoginButtonProps {
  hasSession?: boolean
}

/**
 * @description Renders a button that initiates Spotify OAuth login or redirects to dashboard.
 * @param {LoginButtonProps} props - Component props including session status.
 * @returns {JSX.Element} The login button component.
 */
export const LoginButton = ({ hasSession = false }: LoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      if (hasSession) {
        // If user has session, redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        // If no session, initiate Spotify OAuth
        await signIn('spotify', { callbackUrl: '/dashboard' })
      }
    } catch (error) {
      setHasError(true)
      setIsLoading(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  const buttonText = hasSession ? 'Sign In' : 'Sign in with Spotify'

  return (
    <div className="w-full">
      <Button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        aria-label={hasSession ? "Go to dashboard" : "Sign in with Spotify"}
        aria-describedby={hasError ? "login-error" : undefined}
        className="w-full mt-6"
      >
        {isLoading ? 'Loading…' : buttonText}
      </Button>

      {hasError && (
        <p
          id="login-error"
          className="mt-2 text-sm text-red-600 text-center"
          role="alert"
        >
          Failed to sign in. Please try again.
        </p>
      )}
    </div>
  )
} 