// Rate limiter using sliding window algorithm

const WINDOW_MS = 60 * 1000; // 1 minute window

export interface RateLimitConfig {
	maxRequestsPerMinute: number;
	enabled: boolean;
}

export class RateLimiter {
	private requestTimestamps: number[] = [];
	private config: RateLimitConfig;

	constructor(config: RateLimitConfig) {
		this.config = config;
	}

	updateConfig(config: RateLimitConfig): void {
		this.config = config;
	}

	/**
	 * Checks if a new request can be made without exceeding rate limit
	 * Uses sliding window algorithm to track requests over the last 60 seconds
	 * @returns true if request is allowed, false if rate limit would be exceeded
	 */
	canMakeRequest(): boolean {
		if (!this.config.enabled) {
			return true;
		}

		this.cleanOldTimestamps();
		return this.requestTimestamps.length < this.config.maxRequestsPerMinute;
	}

	/**
	 * Record a new request timestamp
	 */
	recordRequest(): void {
		if (!this.config.enabled) {
			return;
		}

		this.requestTimestamps.push(Date.now());
	}

	/**
	 * Get number of requests remaining in current window
	 */
	getRemainingRequests(): number {
		if (!this.config.enabled) {
			return Infinity;
		}

		this.cleanOldTimestamps();
		return Math.max(0, this.config.maxRequestsPerMinute - this.requestTimestamps.length);
	}

	/**
	 * Get time in milliseconds until next request is allowed
	 */
	getTimeUntilReset(): number {
		if (!this.config.enabled || this.requestTimestamps.length === 0) {
			return 0;
		}

		this.cleanOldTimestamps();

		if (this.requestTimestamps.length < this.config.maxRequestsPerMinute) {
			return 0;
		}

		// Find the oldest timestamp that's still in the window
		const oldestTimestamp = this.requestTimestamps[0];
		const resetTime = oldestTimestamp + WINDOW_MS;

		return Math.max(0, resetTime - Date.now());
	}

	/**
	 * Get formatted time until reset (e.g., "2m 30s")
	 */
	getFormattedResetTime(): string {
		const ms = this.getTimeUntilReset();
		if (ms === 0) {
			return 'now';
		}

		const seconds = Math.ceil(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes > 0) {
			return `${minutes}m ${remainingSeconds}s`;
		} else {
			return `${seconds}s`;
		}
	}

	/**
	 * Remove timestamps older than the sliding window
	 */
	private cleanOldTimestamps(): void {
		const now = Date.now();
		this.requestTimestamps = this.requestTimestamps.filter(
			timestamp => now - timestamp < WINDOW_MS
		);
	}

	/**
	 * Reset all rate limit data (useful for testing or manual reset)
	 */
	reset(): void {
		this.requestTimestamps = [];
	}

	/**
	 * Get current usage stats
	 */
	getStats(): { current: number; limit: number; remaining: number } {
		this.cleanOldTimestamps();
		return {
			current: this.requestTimestamps.length,
			limit: this.config.maxRequestsPerMinute,
			remaining: this.getRemainingRequests()
		};
	}
}
