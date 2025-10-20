# CLAUDE.md - OpenRouter AI Assistant Plugin

## Project Overview
OpenRouter AI Assistant for Obsidian - integrates OpenRouter's API to provide AI-powered text processing directly within Obsidian. Built on the official Obsidian sample plugin template.

**Repository**: https://github.com/cloonix/obsidian-openrouter-integration

## Project Structure

```
openrouter-ai-assistant/
├── main.ts                 # Main plugin class with all commands
├── types.ts                # TypeScript interfaces (settings, API requests/responses)
├── openrouter-service.ts   # OpenRouter API client with error handling
├── prompt-modal.ts         # Prompt input modal UI
├── manifest.json           # Plugin metadata
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── esbuild.config.mjs      # Build configuration
├── main.js                 # Built bundle (generated)
├── README.md               # User documentation
├── BOQ.md                  # Bill of Quantities (project tracking)
└── LICENSE                 # MIT License
```

## Architecture

### Core Components

**1. main.ts** - Plugin Core (416 lines)
- `OpenRouterPlugin` class extends `Plugin`
- 4 commands registered in `onload()`
- Settings management with `loadSettings()` / `saveSettings()`
- `processText()` - central request handler with loading states
- `createNewNote()` - creates notes with frontmatter
- `showResultActionModal()` - user choice modal for active note processing
- `OpenRouterSettingTab` - settings UI with API key, model, temperature, etc.

**2. openrouter-service.ts** - API Client (89 lines)
- `OpenRouterService` class handles all API communication
- `sendRequest()` - sends chat completion requests to OpenRouter
- `testConnection()` - validates API key
- Comprehensive error handling (auth, rate limits, network, empty responses)
- Uses native `fetch()` API

**3. prompt-modal.ts** - UI Component (78 lines)
- `PromptModal` extends `Modal`
- Multi-line textarea for prompt input
- Submit/Cancel buttons
- Keyboard shortcuts (Ctrl/Cmd+Enter to submit, Esc to cancel)
- Auto-focus and validation

**4. types.ts** - Type Definitions (57 lines)
- `OpenRouterSettings` - plugin configuration
- `OpenRouterRequest` / `OpenRouterResponse` - API structures
- `OpenRouterMessage` - chat message format
- `DEFAULT_SETTINGS` - default configuration

## Features Implemented

### Commands

**1. Process Selected Text** (`process-selected-text`)
- Uses `editorCallback` to access selected text
- Opens prompt modal → sends to API → replaces selection
- main.ts:18-33

**2. Process Active Note** (`process-active-note`)
- Uses `checkCallback` to ensure active markdown view
- Gets full note content → prompts user → shows result action modal
- User chooses: insert at cursor or create new note
- main.ts:36-69

**3. Insert at Cursor** (`insert-at-cursor`)
- Generates AI content from prompt alone (no context)
- Inserts response at current cursor position
- main.ts:71-83

**4. Create New Note** (`create-new-note`)
- Generates AI content and creates new markdown file
- Adds frontmatter (ai, model, created, prompt)
- Timestamp-based filename: `AI-Note-YYYY-MM-DDTHH-MM-SS.md`
- Opens new note automatically
- main.ts:85-96

### Settings

All settings persist via Obsidian's `loadData()` / `saveData()`:
- **API Key** - OpenRouter API key (password-masked)
- **Model** - AI model ID (default: `openai/gpt-4o-mini`)
- **Temperature** - 0-1 slider (default: 0.7)
- **Max Tokens** - response length (default: 1000)
- **System Prompt** - optional default instructions
- **Output Folder** - path for AI-generated notes
- **Test Connection** - button to validate API key

### Error Handling

Comprehensive error handling in openrouter-service.ts:
- Missing API key → prompt to configure settings
- 401 Unauthorized → invalid API key message
- 429 Rate Limit → rate limit exceeded notice
- 400 Bad Request → detailed error from API
- Network errors → connection error message
- Empty responses → retry suggestion

Concurrent request protection in main.ts via `isProcessing` flag.

## API Integration

### OpenRouter API Details
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Auth**: Bearer token in `Authorization` header
- **Headers**:
  - `HTTP-Referer: https://obsidian.md`
  - `X-Title: Obsidian OpenRouter AI Assistant`
- **Request**: JSON with `model`, `messages`, `temperature`, `max_tokens`
- **Response**: JSON with `choices[].message.content`

### Message Structure
```typescript
messages: [
  { role: 'system', content: settings.systemPrompt },  // optional
  { role: 'user', content: userPrompt + context }
]
```

## Build System

### Scripts
```bash
npm run dev      # Watch mode with inline sourcemaps
npm run build    # Production: TypeScript check + minified bundle
```

### esbuild Configuration
- Entry: `main.ts` → Output: `main.js` (10KB minified)
- External: `obsidian`, `electron`, `@codemirror/*`
- Format: CommonJS (cjs)
- Target: ES2018
- Tree shaking enabled

### TypeScript Configuration
- Module: ESNext
- Target: ES6
- Strict mode enabled
- Inline source maps (dev only)

## Development Workflow

**1. Local Development**
```bash
npm install
npm run dev
```

**2. Testing in Obsidian**
```bash
# Copy to vault
cp main.js manifest.json ~/path/to/vault/.obsidian/plugins/openrouter-ai-assistant/

# Reload Obsidian (Ctrl/Cmd+R)
```

**3. Production Build**
```bash
npm run build
```

**4. Release Process**
```bash
# Tag version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Create GitHub release
gh release create v1.0.0 main.js manifest.json \
  --title "v1.0.0" \
  --notes "Release notes..."
```

## Privacy & Security

- API key stored locally via Obsidian's `saveData()` (never logged)
- Content only sent when user explicitly triggers command
- No telemetry or analytics
- No background processes
- API key masked in settings UI (type="password")

## Technical Decisions

**Why fetch() instead of axios/node-fetch?**
- Native browser API, no dependencies
- Smaller bundle size
- Obsidian provides standard fetch implementation

**Why single main.js bundle?**
- Obsidian plugin standard
- Simpler deployment (2 files: main.js + manifest.json)
- Better performance (no module loading)

**Why no streaming?**
- Simpler implementation for v1
- OpenRouter supports streaming (future enhancement)
- Tracked in BOQ.md Section 8.1.1

## Known Limitations

- No conversation history (single request/response)
- No streaming UI
- No chunking for very large notes
- No token usage tracking
- Desktop and mobile compatible (no desktop-only APIs used)

## Future Enhancements (BOQ.md Section 8)

- Streaming responses
- Conversation history
- Custom prompt templates UI
- Token usage tracking
- Response caching
- Batch processing
- Context menu integration

## Resources

- **OpenRouter API**: https://openrouter.ai/docs
- **OpenRouter Models**: https://openrouter.ai/models
- **Obsidian API**: https://github.com/obsidianmd/obsidian-api
- **Plugin Guidelines**: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines

## Current Status

**Version**: 1.0.0
**Released**: 2025-10-20
**Status**: Production-ready, all core features implemented

All features from BOQ.md Sections 1-3 completed. Plugin is functional and published on GitHub with full documentation.
