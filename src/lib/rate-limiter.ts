/**
 * @fileoverview Rate limiting utility for Spotify API requests.
 *
 * Handles rate limiting with exponential backoff and retry logic for robust API interactions.
 */

export interface RateLimitConfig {
    maxRetries: number
    baseDelay: number
    maxDelay: number
    backoffMultiplier: number
}

export interface RateLimitState {
    lastRequestTime: number
    requestCount: number
    resetTime: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
}

/**
 * @description Rate limiter class for managing API request limits.
 */
export class RateLimiter {
    private state: RateLimitState = {
        lastRequestTime: 0,
        requestCount: 0,
        resetTime: 0,
    }

    private config: RateLimitConfig

    constructor(config: Partial<RateLimitConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config }
    }

    /**
     * @description Updates rate limit state from API response headers.
     * @param {Headers} headers - Response headers from Spotify API.
     */
    updateFromHeaders(headers: Headers): void {
        if (!headers || typeof (headers as any).get !== 'function') {
            return
        }
        const remaining = headers.get('X-RateLimit-Remaining')
        const reset = headers.get('X-RateLimit-Reset')
        const limit = headers.get('X-RateLimit-Limit')

        if (reset) {
            this.state.resetTime = parseInt(reset) * 1000 // Convert to milliseconds
        }

        if (remaining) {
            this.state.requestCount = parseInt(limit || '0') - parseInt(remaining)
        }
    }

    /**
     * @description Checks if we should wait before making a request.
     * @returns {Promise<void>} Resolves when it's safe to make a request.
     */
    async waitIfNeeded(): Promise<void> {
        const now = Date.now()

        // If we've hit the rate limit, wait until reset
        if (this.state.resetTime > now) {
            const waitTime = this.state.resetTime - now + 1000 // Add 1 second buffer
            console.log(`Rate limit hit, waiting ${waitTime}ms`)
            await this.delay(waitTime)
            this.state.requestCount = 0
        }

        // Add small delay between requests to be respectful
        const timeSinceLastRequest = now - this.state.lastRequestTime
        if (timeSinceLastRequest < 100) {
            await this.delay(100 - timeSinceLastRequest)
        }

        this.state.lastRequestTime = Date.now()
    }

    /**
     * @description Calculates delay for exponential backoff.
     * @param {number} attempt - Current attempt number.
     * @returns {number} Delay in milliseconds.
     */
    private calculateBackoffDelay(attempt: number): number {
        const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt)
        return Math.min(delay, this.config.maxDelay)
    }

    /**
     * @description Delays execution for specified milliseconds.
     * @param {number} ms - Milliseconds to delay.
     * @returns {Promise<void>}
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * @description Executes a function with rate limiting and retry logic.
     * @param {Function} fn - Function to execute.
     * @returns {Promise<T>} Result of the function.
     */
    async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: Error

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                await this.waitIfNeeded()
                return await fn()
            } catch (error) {
                lastError = error as Error

                // Check if it's a rate limit error
                if (this.isRateLimitError(error)) {
                    console.log(`Rate limit error on attempt ${attempt + 1}`)

                    if (attempt < this.config.maxRetries) {
                        const delay = this.calculateBackoffDelay(attempt)
                        console.log(`Retrying in ${delay}ms`)
                        await this.delay(delay)
                        continue
                    }
                }

                // For non-rate-limit errors, don't retry
                throw error
            }
        }

        throw lastError!
    }

    /**
     * @description Checks if an error is a rate limit error.
     * @param {unknown} error - Error to check.
     * @returns {boolean} True if it's a rate limit error.
     */
    private isRateLimitError(error: unknown): boolean {
        if (error instanceof Error) {
            return error.message.includes('429') ||
                error.message.includes('rate limit') ||
                error.message.includes('too many requests')
        }
        return false
    }
}

/**
 * @description Global rate limiter instance for Spotify API.
 */
export const spotifyRateLimiter = new RateLimiter({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
}) 