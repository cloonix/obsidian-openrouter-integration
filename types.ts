// TypeScript interfaces for OpenRouter AI Assistant Plugin

// Default system prompt for concise responses
export const DEFAULT_CONCISE_PROMPT = "Return only the requested output without explanations, commentary, or additional text. For translations, return only the translated text. For grammar corrections, return only the corrected text. Do not add markdown formatting unless specifically requested.";

export interface ModelConfig {
	id: string;
	name: string;
	modelId: string;
}

export interface OpenRouterSettings {
	settingsVersion?: number;
	apiKey: string;
	models: ModelConfig[];
	defaultModelId: string;
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
	settingsVersion: 2,
	apiKey: '',
	models: [
		{ id: 'gemini-flash', name: 'Gemini Flash (Fast & Cheap)', modelId: 'google/gemini-flash-1.5' },
		{ id: 'gemini-flash-8b', name: 'Gemini Flash 8B (Fastest)', modelId: 'google/gemini-flash-1.5-8b' },
		{ id: 'gpt-4o-mini', name: 'GPT-4o Mini', modelId: 'openai/gpt-4o-mini' },
		{ id: 'claude-haiku', name: 'Claude 3 Haiku', modelId: 'anthropic/claude-3-haiku' }
	],
	defaultModelId: 'gemini-flash',
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
