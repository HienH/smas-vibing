/**
 * @fileoverview Toast notification system for user feedback.
 *
 * Provides toast notifications for success, error, and info states with proper accessibility.
 */
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
    clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * @description Toast provider component for managing toast notifications.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const clearToasts = useCallback(() => {
        setToasts([])
    }, [])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast: Toast = {
            id,
            duration: 5000,
            ...toast,
        }

        setToasts(prev => [...prev, newToast])

        // Auto-remove toast after duration
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, newToast.duration)
        }
    }, [removeToast])



    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    )
}

/**
 * @description Hook for using toast notifications.
 */
export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

/**
 * @description Toast container component for displaying toasts.
 */
function ToastContainer() {
    const { toasts, removeToast } = useToast()

    if (toasts.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full sm:max-w-md">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    )
}

/**
 * @description Individual toast item component.
 */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const iconMap = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle,
    }

    const colorMap = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    }

    const Icon = iconMap[toast.type]

    return (
        <div
            className={cn(
                'flex items-start p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out',
                'transform translate-x-0 opacity-100',
                colorMap[toast.type]
            )}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >
            <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{toast.title}</h4>
                {toast.message && (
                    <p className="mt-1 text-sm opacity-90">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

/**
 * @description Utility functions for common toast types.
 */
export const toast = {
    success: (title: string, message?: string) => {
        // This will be used with useToast hook
        return { type: 'success' as const, title, message }
    },
    error: (title: string, message?: string) => {
        return { type: 'error' as const, title, message }
    },
    info: (title: string, message?: string) => {
        return { type: 'info' as const, title, message }
    },
    warning: (title: string, message?: string) => {
        return { type: 'warning' as const, title, message }
    },
} 