/**
 * @fileoverview Loading spinner component for consistent loading states.
 *
 * Provides a standardized loading indicator with customizable size and text.
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

/**
 * @description Renders a loading spinner with optional text.
 * @param {LoadingSpinnerProps} props - Component props.
 * @returns {JSX.Element} The loading spinner component.
 */
export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 border-green-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-4 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  )
} 