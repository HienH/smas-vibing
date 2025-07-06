"use client"
/**
 * @fileoverview Login button component for Spotify OAuth authentication.
 *
 * Handles user authentication flow with proper error handling and loading states.
 */
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui'

/**
 * @description Renders a button that initiates Spotify OAuth login.
 * @returns {JSX.Element} The login button component.
 */
export const LoginButton = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    setHasError(false)

    try {
      await signIn('spotify', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Login error:', error)
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

  return (
    <div className="w-full">
      <Button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        aria-label="Sign in with Spotify"
        aria-describedby={hasError ? "login-error" : undefined}
        className="w-full mt-6"
      >
        {isLoading ? 'Signing in…' : 'Sign in with Spotify'}
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