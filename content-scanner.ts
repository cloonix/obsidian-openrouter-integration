// Content scanner for detecting potentially sensitive information

const CONTEXT_WINDOW_CHARS = 20; // Characters to check before/after match for context
const MIN_CONTENT_LENGTH = 10; // Minimum content length to scan

export interface ScanMatch {
	type: string;
	pattern: string;
	match: string;
	index: number;
}

export interface ScanResult {
	hasSensitiveContent: boolean;
	matches: ScanMatch[];
}

export class ContentScanner {
	private patterns: Array<{ type: string; regex: RegExp; description: string }> = [
		// API Keys and Tokens
		{ type: 'API Key', regex: /\b(sk-[a-zA-Z0-9]{20,})\b/g, description: 'OpenAI/Stripe API key' },
		{ type: 'API Key', regex: /\b(sk-or-v1-[a-zA-Z0-9]{48,})\b/g, description: 'OpenRouter API key' },
		{ type: 'API Key', regex: /\b(AKIA[0-9A-Z]{16})\b/g, description: 'AWS access key' },
		{ type: 'API Key', regex: /\b([a-zA-Z0-9_-]{40})\s*[:=]\s*["']?([a-zA-Z0-9_-]{40})["']?/g, description: 'Generic API key pattern' },

		// GitHub Tokens
		{ type: 'GitHub Token', regex: /\b(ghp_[a-zA-Z0-9]{36})\b/g, description: 'GitHub personal access token' },
		{ type: 'GitHub Token', regex: /\b(github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b/g, description: 'GitHub fine-grained token' },
		{ type: 'GitHub Token', regex: /\b(gho_[a-zA-Z0-9]{36})\b/g, description: 'GitHub OAuth token' },

		// Private Keys
		{ type: 'Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----/g, description: 'Private key' },

		// Bearer Tokens
		{ type: 'Bearer Token', regex: /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, description: 'Bearer authentication token' },

		// Generic Secrets Pattern
		{ type: 'Secret', regex: /(secret|password|passwd|pwd|token|api[_-]?key)["\s:=]+["']?([a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,})["']?/gi, description: 'Generic secret pattern' },

		// Connection Strings
		{ type: 'Connection String', regex: /(mongodb|postgres|mysql):\/\/[^\s<>"{}|\\^`\[\]]+/gi, description: 'Database connection string' },

		// JWT Tokens
		{ type: 'JWT Token', regex: /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, description: 'JWT token' },
	];

	/**
	 * Parse code block boundaries in the content
	 * Returns array of [start, end] index ranges for code blocks
	 */
	private parseCodeBlocks(content: string): Array<[number, number]> {
		const codeBlocks: Array<[number, number]> = [];
		const codeBlockRegex = /```/g;
		const matches: number[] = [];
		let match;

		// Find all ``` markers
		while ((match = codeBlockRegex.exec(content)) !== null) {
			matches.push(match.index);
		}

		// Pair them up (opening and closing)
		for (let i = 0; i < matches.length - 1; i += 2) {
			codeBlocks.push([matches[i], matches[i + 1]]);
		}

		return codeBlocks;
	}

	/**
	 * Check if an index falls within any code block range
	 */
	private isInCodeBlock(index: number, codeBlocks: Array<[number, number]>): boolean {
		return codeBlocks.some(([start, end]) => index >= start && index <= end);
	}

	/**
	 * Scans content for sensitive patterns like API keys, tokens, and credentials
	 * Automatically filters out matches in code blocks and example text
	 * @param content - Text content to scan for sensitive information
	 * @returns ScanResult containing detected matches and whether sensitive content was found
	 */
	scan(content: string): ScanResult {
		const matches: ScanMatch[] = [];

		// Skip scanning if content is very short
		if (content.length < MIN_CONTENT_LENGTH) {
			return { hasSensitiveContent: false, matches: [] };
		}

		// Parse all code block boundaries
		const codeBlocks = this.parseCodeBlocks(content);

		// Check each pattern
		for (const pattern of this.patterns) {
			const regex = new RegExp(pattern.regex);
			let match;

			while ((match = regex.exec(content)) !== null) {
				// Skip if in a code block
				if (this.isInCodeBlock(match.index, codeBlocks)) {
					continue;
				}

				// Skip if it looks like an example
				const before = content.substring(Math.max(0, match.index - CONTEXT_WINDOW_CHARS), match.index);
				const after = content.substring(match.index, Math.min(content.length, match.index + match[0].length + CONTEXT_WINDOW_CHARS));
				const isExample = before.toLowerCase().includes('example') ||
				                 after.toLowerCase().includes('example') ||
				                 before.includes('XXXX') || after.includes('XXXX');

				if (!isExample) {
					matches.push({
						type: pattern.type,
						pattern: pattern.description,
						match: match[0],
						index: match.index
					});
				}
			}
		}

		return {
			hasSensitiveContent: matches.length > 0,
			matches: matches
		};
	}

	/**
	 * Get a preview of content with sensitive parts redacted
	 */
	getRedactedPreview(content: string, scanResult: ScanResult): string {
		if (!scanResult.hasSensitiveContent) {
			return content;
		}

		let redacted = content;
		const sortedMatches = [...scanResult.matches].sort((a, b) => b.index - a.index);

		for (const match of sortedMatches) {
			const before = redacted.substring(0, match.index);
			const after = redacted.substring(match.index + match.match.length);
			const redaction = '[REDACTED]';
			redacted = before + redaction + after;
		}

		return redacted;
	}

	/**
	 * Get summary of detected sensitive content
	 */
	getSummary(scanResult: ScanResult): string {
		if (!scanResult.hasSensitiveContent) {
			return 'No sensitive content detected.';
		}

		const typeCount = scanResult.matches.reduce((acc, match) => {
			acc[match.type] = (acc[match.type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const summary = Object.entries(typeCount)
			.map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
			.join(', ');

		return `Detected: ${summary}`;
	}
}
