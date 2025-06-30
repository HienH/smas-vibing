/**
 * @fileoverview Card component for consistent layout containers.
 *
 * Provides a standardized card container with header and content areas.
 */

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

/**
 * @description Renders a card container.
 * @param {CardProps} props - Component props.
 * @returns {JSX.Element} The card component.
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  )
}

/**
 * @description Renders a card header section.
 * @param {CardHeaderProps} props - Component props.
 * @returns {JSX.Element} The card header component.
 */
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

/**
 * @description Renders a card content section.
 * @param {CardContentProps} props - Component props.
 * @returns {JSX.Element} The card content component.
 */
export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
} 