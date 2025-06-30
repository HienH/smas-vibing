/**
 * @fileoverview Error message component for consistent error display.
 *
 * Provides a standardized error display with optional retry functionality.
 */

import { Button } from './button'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

/**
 * @description Renders an error message with optional retry button.
 * @param {ErrorMessageProps} props - Component props.
 * @returns {JSX.Element} The error message component.
 */
export function ErrorMessage({ 
  message, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Retry
        </Button>
      )}
    </div>
  )
} 