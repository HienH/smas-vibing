/**
 * @fileoverview Permission handling utility for Spotify API.
 *
 * Handles revoked permissions and provides user-friendly error messages and recovery options.
 */

export interface PermissionError {
    type: 'token_expired' | 'permission_revoked' | 'insufficient_scope' | 'unknown'
    message: string
    recoveryAction?: string
}

/**
 * @description Checks if an error is related to Spotify permissions.
 * @param {unknown} error - Error to check.
 * @returns {PermissionError | null} Permission error details or null.
 */
export function checkPermissionError(error: unknown): PermissionError | null {
    if (!(error instanceof Error)) {
        return null
    }

    const message = error.message.toLowerCase()
    const status = (error as any).status

    // Token expired
    if (message.includes('token_expired') || message.includes('401') || status === 401) {
        return {
            type: 'token_expired',
            message: 'Your Spotify session has expired. Please sign in again.',
            recoveryAction: 'Sign in again'
        }
    }

    // Permission revoked
    if (message.includes('permission') || message.includes('scope') || status === 403) {
        return {
            type: 'permission_revoked',
            message: 'Spotify permissions have been revoked. Please reconnect your account.',
            recoveryAction: 'Reconnect Spotify'
        }
    }

    // Insufficient scope
    if (message.includes('insufficient_scope') || message.includes('scope')) {
        return {
            type: 'insufficient_scope',
            message: 'Additional permissions are required. Please reconnect your Spotify account.',
            recoveryAction: 'Update permissions'
        }
    }

    return null
}

/**
 * @description Handles permission errors with appropriate user actions.
 * @param {PermissionError} permissionError - The permission error.
 * @param {Function} onReconnect - Callback for reconnection action.
 */
export function handlePermissionError(
    permissionError: PermissionError,
    onReconnect: () => void
): void {
    console.error('Permission error:', permissionError)

    switch (permissionError.type) {
        case 'token_expired':
        case 'permission_revoked':
        case 'insufficient_scope':
            // Redirect to login or trigger reconnection
            onReconnect()
            break
        default:
            // For unknown errors, just log them
            console.error('Unknown permission error:', permissionError)
    }
}

/**
 * @description Checks if user has required Spotify scopes.
 * @param {string[]} requiredScopes - Required scopes.
 * @param {string[]} userScopes - User's current scopes.
 * @returns {boolean} True if user has all required scopes.
 */
export function hasRequiredScopes(
    requiredScopes: string[],
    userScopes: string[]
): boolean {
    return requiredScopes.every(scope => userScopes.includes(scope))
}

/**
 * @description Gets missing scopes for user.
 * @param {string[]} requiredScopes - Required scopes.
 * @param {string[]} userScopes - User's current scopes.
 * @returns {string[]} Missing scopes.
 */
export function getMissingScopes(
    requiredScopes: string[],
    userScopes: string[]
): string[] {
    return requiredScopes.filter(scope => !userScopes.includes(scope))
}

/**
 * @description Required Spotify scopes for SMAS functionality.
 */
export const REQUIRED_SPOTIFY_SCOPES = [
    'user-top-read',
    'playlist-modify-public',
    'playlist-read-private',
    'user-read-email',
    'user-library-read',
    'ugc-image-upload'
] as const

/**
 * @description Checks if user has all required scopes for SMAS.
 * @param {string[]} userScopes - User's current scopes.
 * @returns {boolean} True if user has all required scopes.
 */
export function hasAllRequiredScopes(userScopes: string[]): boolean {
    return hasRequiredScopes([...REQUIRED_SPOTIFY_SCOPES], userScopes)
} 