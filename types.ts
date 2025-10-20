// TypeScript interfaces for OpenRouter AI Assistant Plugin

export interface OpenRouterSettings {
	apiKey: string;
	model: string;
	temperature: number;
	maxTokens: number;
	systemPrompt: string;
	outputFolder: string;
	// Rate limiting
	enableRateLimiting: boolean;
	maxRequestsPerMinute: number;
	// Content security
	enableContentScanning: boolean;
	scanAction: 'warn' | 'block';
}

export const DEFAULT_SETTINGS: OpenRouterSettings = {
	apiKey: '',
	model: 'openai/gpt-4o-mini',
	temperature: 0.7,
	maxTokens: 1000,
	systemPrompt: '',
	outputFolder: '',
	enableRateLimiting: true,
	maxRequestsPerMinute: 20,
	enableContentScanning: true,
	scanAction: 'warn'
};

export interface OpenRouterMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface OpenRouterRequest {
	model: string;
	messages: OpenRouterMessage[];
	temperature?: number;
	max_tokens?: number;
}

export interface OpenRouterResponse {
	id: string;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface OpenRouterError {
	error: {
		message: string;
		type: string;
		code?: string;
	};
}
