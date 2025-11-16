import { Notice } from 'obsidian';
import { OpenRouterRequest, OpenRouterResponse, OpenRouterError } from './types';
import { RateLimiter, RateLimitConfig } from './rate-limiter';

export class OpenRouterService {
	private readonly apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
	private apiKey: string;
	private rateLimiter: RateLimiter;

	constructor(apiKey: string, rateLimitConfig: RateLimitConfig) {
		this.apiKey = apiKey;
		this.rateLimiter = new RateLimiter(rateLimitConfig);
	}

	updateApiKey(apiKey: string): void {
		this.apiKey = apiKey;
	}

	updateRateLimitConfig(config: RateLimitConfig): void {
		this.rateLimiter.updateConfig(config);
	}

	getRateLimiter(): RateLimiter {
		return this.rateLimiter;
	}

	/**
	 * Sends a request to the OpenRouter API
	 * Validates API key, checks rate limits, and handles errors
	 * @param request - OpenRouter API request with model, messages, and optional parameters
	 * @returns Promise resolving to the AI's text response
	 * @throws Error if API key missing, rate limit exceeded, or API request fails
	 */
	async sendRequest(request: OpenRouterRequest): Promise<string> {
		if (!this.apiKey || this.apiKey.trim() === '') {
			throw new Error('API key is not configured. Please set your OpenRouter API key in plugin settings.');
		}

		// Check rate limit
		if (!this.rateLimiter.canMakeRequest()) {
			const resetTime = this.rateLimiter.getFormattedResetTime();
			throw new Error(`Rate limit exceeded. Please wait ${resetTime} before trying again.`);
		}

		try {
			const response = await fetch(this.apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`,
					'HTTP-Referer': 'https://obsidian.md',
					'X-Title': 'Obsidian OpenRouter AI Assistant'
				},
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				const errorData = await response.json() as OpenRouterError;
				const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;

				if (response.status === 401) {
					throw new Error('Invalid API key. Please check your OpenRouter API key in settings.');
				} else if (response.status === 429) {
					throw new Error('Rate limit exceeded. Please wait a moment and try again.');
				} else if (response.status === 400) {
					throw new Error(`Bad request: ${errorMessage}`);
				} else {
					throw new Error(`API Error: ${errorMessage}`);
				}
			}

			const data = await response.json() as OpenRouterResponse;

			if (!data.choices || data.choices.length === 0) {
				throw new Error('Empty response from API. Please try again.');
			}

			const content = data.choices[0].message.content;

			if (!content || content.trim() === '') {
				throw new Error('API returned empty content. Please try again.');
			}

			// Record successful request
			this.rateLimiter.recordRequest();

			return content;

		} catch (error) {
			if (error instanceof Error) {
				throw error;
			} else {
				throw new Error('Network error. Please check your internet connection and try again.');
			}
		}
	}

	async testConnection(): Promise<boolean> {
		try {
			const testRequest: OpenRouterRequest = {
				model: 'openai/gpt-4o-mini',
				messages: [
					{ role: 'user', content: 'Hello' }
				],
				max_tokens: 10
			};

			await this.sendRequest(testRequest);
			return true;
		} catch (error) {
			if (error instanceof Error) {
				new Notice(`API connection test failed: ${error.message}`);
			}
			return false;
		}
	}
}
