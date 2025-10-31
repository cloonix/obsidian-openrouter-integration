# OpenRouter AI Assistant for Obsidian

> **Why this plugin?** I wanted simple AI integration for writing and improving text in Obsidian. Other AI plugins felt bloated with features I didn't need—chat interfaces, conversation history, complex UIs. I just wanted to select text, ask AI to improve it, and get back clean results. So I built this.

Simple, focused AI text processing using OpenRouter's API. Select text, describe what you want, get the result—nothing more, nothing less.

## What It Does

- **Select & transform** text (fix grammar, translate, rewrite, summarize)
- **Process entire notes** (replace, insert at cursor, or create new note)
- **Generate content** from prompts
- **Concise responses by default** (no chatty explanations, just the result)
- **Context menu integration** (right-click → AI commands)

## Installation

**Option 1: BRAT (easiest)**
1. Install [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Open BRAT settings → Add Beta plugin
3. Enter: `cloonix/obsidian-openrouter-integration`
4. Enable "OpenRouter AI Assistant" in Community Plugins

**Option 2: Manual**
1. Download `main.js` and `manifest.json` from [latest release](https://github.com/cloonix/obsidian-openrouter-integration/releases)
2. Create folder: `.obsidian/plugins/openrouter-ai-assistant/`
3. Copy both files into this folder
4. Reload Obsidian and enable the plugin

## Quick Start

1. Get an API key from [OpenRouter](https://openrouter.ai/keys) (pay-as-you-go, no subscription)
2. Install plugin and add API key in settings
3. Select text → right-click → **AI: Process selected text** → enter prompt

That's it. Works with Command Palette (`Ctrl/Cmd+P`) or context menu (right-click).

## Common Use Cases

```
Select text → "translate to German"        → get translation
Select text → "fix grammar"                → get corrected text
Select text → "make this more professional" → get rewritten text
Process note → "summarize"                 → choose where to put result
Empty prompt → "write about X"             → generate new content
```

## Configuration

**Required:**
- API key from [OpenRouter](https://openrouter.ai/keys)

**Optional:**
- Model (default: `openai/gpt-4o-mini` - fast & cheap)
- System prompt (leave empty for concise responses)
- Rate limiting (default: 20 requests/minute)
- Content scanning (warns about API keys/passwords before sending)

Browse 200+ models at [OpenRouter](https://openrouter.ai/models) - GPT-4, Claude, Llama, Gemini, and more.

## Why OpenRouter?

- **One API, all models** - Switch between GPT-4, Claude, Llama without managing multiple API keys
- **Pay-as-you-go** - No subscriptions, pay only for what you use (starting at $0.0001/request)
- **Transparent pricing** - See costs per model upfront
- **Works with this simple plugin** - No complex setup needed

## Privacy

Content sent to OpenRouter only when you trigger commands. API key stored locally. No telemetry.

## License

MIT - [Report issues](https://github.com/cloonix/obsidian-openrouter-integration/issues)
