/**
 * @fileoverview Error boundary component for catching and handling React errors.
 *
 * Provides graceful error handling with user-friendly messages and recovery options.
 */
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardHeader, CardContent, Button } from './index'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
    hasError: boolean
    error?: Error
    errorInfo?: ErrorInfo
}

/**
 * @description Error boundary component that catches React errors and displays fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)

        this.setState({ error, errorInfo })

        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    handleGoHome = () => {
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-red-700 mb-2">
                                Something went wrong
                            </h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                We encountered an unexpected error. Don't worry, your data is safe.
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-sm">
                                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                        Error details (development only)
                                    </summary>
                                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                        {this.state.error.toString()}
                                    </pre>
                                </details>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={this.handleRetry}
                                    className="flex-1"
                                    aria-label="Try again"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    onClick={this.handleGoHome}
                                    variant="outline"
                                    className="flex-1"
                                    aria-label="Go to home page"
                                >
                                    Go Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return this.props.children
    }
} 