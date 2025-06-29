"use client"
/**
 * @fileoverview LoginButton - Triggers Spotify OAuth login using NextAuth.js.
 *
 * Used on the landing page for user authentication.
 */
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '../ui/button'

/**
 * @description Renders a button that initiates Spotify OAuth login.
 * @returns {JSX.Element} The login button.
 */
export const LoginButton = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      await signIn('spotify')
    } catch (error) {
      setIsLoading(false)
      // Optionally handle error
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      aria-label="Sign in with Spotify"
      className="w-full mt-6"
    >
      {isLoading ? 'Signing in…' : 'Get Started with Spotify'}
    </Button>
  )
} 