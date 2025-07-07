/**
 * @fileoverview Loading state component for async operations.
 *
 * Provides different loading states with proper accessibility and mobile responsiveness.
 */
'use client'

import React from 'react'
import { LoadingSpinner } from './loading-spinner'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
    isLoading: boolean
    text?: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'spinner' | 'skeleton' | 'pulse'
    className?: string
    children?: React.ReactNode
}

interface SkeletonProps {
    className?: string
    lines?: number
}

/**
 * @description Skeleton loading component for content placeholders.
 */
function Skeleton({ className, lines = 1 }: SkeletonProps) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-gray-200 rounded animate-pulse"
                    style={{ width: `${Math.random() * 40 + 60}%` }}
                />
            ))}
        </div>
    )
}

/**
 * @description Pulse loading component for simple loading states.
 */
function Pulse({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center justify-center p-4', className)}>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mx-1" />
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.4s' }} />
        </div>
    )
}

/**
 * @description Loading state component with different variants.
 */
export function LoadingState({
    isLoading,
    text,
    size = 'md',
    variant = 'spinner',
    className,
    children
}: LoadingStateProps) {
    if (!isLoading) {
        return <>{children}</>
    }

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    }

    const renderLoadingContent = () => {
        switch (variant) {
            case 'skeleton':
                return <Skeleton className="w-full" lines={3} />
            case 'pulse':
                return <Pulse />
            case 'spinner':
            default:
                return (
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <LoadingSpinner size={size} />
                        {text && (
                            <p className={cn('text-gray-600 text-center', sizeClasses[size])}>
                                {text}
                            </p>
                        )}
                    </div>
                )
        }
    }

    return (
        <div
            className={cn(
                'flex items-center justify-center min-h-[200px]',
                className
            )}
            role="status"
            aria-live="polite"
            aria-label={text || 'Loading'}
        >
            {renderLoadingContent()}
        </div>
    )
}

/**
 * @description Loading overlay component for blocking operations.
 */
export function LoadingOverlay({
    isLoading,
    text = 'Loading...',
    children
}: {
    isLoading: boolean
    text?: string
    children: React.ReactNode
}) {
    if (!isLoading) {
        return <>{children}</>
    }

    return (
        <div className="relative">
            {children}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center space-y-3">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600 font-medium">{text}</p>
                </div>
            </div>
        </div>
    )
}

/**
 * @description Loading button component for form submissions.
 */
export function LoadingButton({
    isLoading,
    loadingText = 'Loading...',
    children,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean
    loadingText?: string
}) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center space-x-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading && <LoadingSpinner size="sm" />}
            <span>{isLoading ? loadingText : children}</span>
        </button>
    )
} 