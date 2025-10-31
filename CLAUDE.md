# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
OpenRouter AI Assistant for Obsidian - integrates OpenRouter's API to provide AI-powered text processing directly within Obsidian. Built on the official Obsidian sample plugin template.

**Repository**: https://github.com/cloonix/obsidian-openrouter-integration

## Project Structure

```
openrouter-ai-assistant/
├── main.ts                    # Main plugin class, commands, settings UI
├── types.ts                   # TypeScript interfaces (settings, API types)
├── openrouter-service.ts      # OpenRouter API client with rate limiting
├── rate-limiter.ts            # Sliding window rate limiter
├── content-scanner.ts         # Security: scans for sensitive data patterns
├── security-warning-modal.ts  # UI: warns users about sensitive content
├── prompt-modal.ts            # UI: prompt input modal
├── manifest.json              # Plugin metadata
├── package.json               # Dependencies and scripts
├── esbuild.config.mjs         # Build configuration
└── main.js                    # Built bundle (generated)
```

## Architecture

### Data Flow
1. User triggers command (command palette or context menu) → `PromptModal` opens
2. User enters prompt → Security scan (if enabled) → API request via `OpenRouterService`
3. Rate limiter checks quota → Request sent to OpenRouter → Response processed
4. Result inserted at cursor / replaces selection / creates new note

### Core Components

**main.ts** - Plugin Core
- `OpenRouterPlugin` class: main plugin logic
- 4 commands: process selection, process note, insert at cursor, create new note
- Context menu integration (right-click in editor)
- `processText()` - central handler: security scan → API call → result handling
- `ResultActionModal` - nested class for choosing where to place AI results
- `OpenRouterSettingTab` - settings UI

**openrouter-service.ts** - API Client
- `OpenRouterService` class: handles OpenRouter API communication
- `sendRequest()` - sends requests with rate limit enforcement
- `testConnection()` - validates API key
- Integrates `RateLimiter` for request throttling

**rate-limiter.ts** - Rate Limiting
- `RateLimiter` class: sliding window algorithm
- Tracks requests per minute, enforces limits
- Provides remaining quota and reset time

**content-scanner.ts** - Security Scanning
- `ContentScanner` class: detects sensitive patterns (API keys, tokens, passwords)
- Pattern matching with false positive reduction (ignores code blocks/examples)
- Returns redacted previews and summaries

**security-warning-modal.ts** - Security UI
- `SecurityWarningModal` class: warns about detected sensitive content
- Shows match details, allows user to cancel or proceed

**types.ts** - Type Definitions
- `OpenRouterSettings` - plugin configuration including security settings
- `OpenRouterRequest` / `OpenRouterResponse` - API structures
- `DEFAULT_SETTINGS` - defaults including rate limiting (20 req/min) and content scanning

## Commands

All accessible via Command Palette (`Ctrl/Cmd+P`) and context menu (right-click in editor):

1. **AI: Process selected text** - Transform selected text with AI prompt, replaces selection
2. **AI: Process active note** - Send entire note to AI, choose to insert or create new note
3. **AI: Insert at cursor** - Generate AI content from prompt, insert at cursor
4. **AI: Create new note** - Generate AI content as new note with frontmatter

## Settings Architecture

Settings persist via `loadData()` / `saveData()` in main.ts:173-188.

**API Configuration**:
- `apiKey` - OpenRouter API key (password field)
- `model` - Model ID (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-5-sonnet`)
- `temperature` - 0-1 (creativity control)
- `maxTokens` - response length limit (default: 500)
- `systemPrompt` - optional custom system message (empty = concise mode)

**Security Settings** (v1.2.0):
- `enableRateLimiting` - toggle rate limiting (default: true)
- `maxRequestsPerMinute` - 1-60 (default: 20)
- `enableContentScanning` - scan for sensitive data (default: true)
- `scanAction` - 'warn' or 'block' when sensitive content detected

**UI Features**:
- Status bar shows remaining requests when rate limiting enabled
- Color coding: red (rate limited), yellow (≤3 remaining), gray (normal)
- Updates every 10 seconds via `setInterval` in main.ts:32-34

## Build & Development

### Commands
```bash
npm install              # Install dependencies
npm run dev             # Watch mode with inline sourcemaps
npm run build           # Production: TypeScript check + minified bundle
```

### Build System
- **esbuild** bundles `main.ts` → `main.js` (~10KB minified)
- External deps: `obsidian`, `electron`, `@codemirror/*`
- Format: CommonJS (cjs), Target: ES2018

### Testing in Obsidian
```bash
# Copy built files to vault
cp main.js manifest.json ~/path/to/vault/.obsidian/plugins/openrouter-ai-assistant/

# Reload Obsidian: Ctrl/Cmd+R
```

## Security Implementation

### Content Scanner (content-scanner.ts)
- Regex patterns detect: API keys, tokens, private keys, passwords, connection strings, JWTs
- False positive reduction: ignores content in code blocks (```) or with "example"/"XXXX"
- Returns `ScanResult` with matches array

### Security Flow (main.ts:228-256)
1. If `enableContentScanning` → scan prompt + text
2. If sensitive content detected:
   - `scanAction: 'block'` → show notice, abort request
   - `scanAction: 'warn'` → show `SecurityWarningModal`, wait for user decision
3. Proceed only if clean or user confirms

### Rate Limiter (rate-limiter.ts)
- Sliding window algorithm: tracks timestamps in 60-second window
- `canMakeRequest()` checks before API call in openrouter-service.ts:33-36
- Records timestamp after successful request (line 78)
- Status bar in main.ts shows quota (190-211)

## Key Implementation Details

### Message Building (main.ts:263-282)
**Concise Mode by Default**: System prompt is always included - uses `DEFAULT_CONCISE_PROMPT` unless user provides custom override.

```typescript
// Use custom system prompt if provided, otherwise use concise default
const systemPrompt = settings.systemPrompt?.trim() || DEFAULT_CONCISE_PROMPT;

messages = [
  { role: 'system', content: systemPrompt },           // always included
  { role: 'user', content: `${prompt}\n\n${text}` }    // or just prompt if no text
]
```

**DEFAULT_CONCISE_PROMPT** (types.ts:4): Instructs LLM to return only the result without explanations, commentary, or markdown formatting. Ideal for translations, grammar fixes, and text transformations.

### Response Time Display (main.ts:261, 304-305)
- Tracks `startTime` before API request
- Displays elapsed time in success notice: `AI response received! (2.3s)`
- Helps users understand API latency

### New Note Creation (main.ts:322-361)
- Filename: `AI-Note-YYYY-MM-DDTHH-MM-SS.md`
- Frontmatter includes: ai source, model used, timestamp, prompt
- Created in `settings.outputFolder` (or vault root if empty)
- Automatically opens after creation

### Context Menu Registration (main.ts:121-166)
- Registers on `editor-menu` event
- Conditionally shows "Process selected text" only if text selected
- Always shows "Process active note"

## Technical Constraints

- **No streaming**: OpenRouter supports it, but not implemented (simpler UX for v1)
- **No conversation history**: Each request is independent
- **Concurrent requests blocked**: `isProcessing` flag prevents race conditions
- **Mobile compatible**: Uses only standard Obsidian APIs (no desktop-only features)

## Version History

- **v1.2.0** (current): Added rate limiting, content scanning, context menu
- **v1.1.0**: Context menu support
- **v1.0.0**: Initial release with 4 commands, basic error handling
