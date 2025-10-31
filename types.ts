// TypeScript interfaces for OpenRouter AI Assistant Plugin

// Default system prompt for concise responses
export const DEFAULT_CONCISE_PROMPT = "Return only the requested output without explanations, commentary, or additional text. For translations, return only the translated text. For grammar corrections, return only the corrected text. Do not add markdown formatting unless specifically requested.";

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
	maxTokens: 500,
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
