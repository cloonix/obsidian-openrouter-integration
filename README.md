# OpenRouter AI Assistant for Obsidian

AI-powered text processing for Obsidian using OpenRouter's API. Process selections, generate content, and create notes with AI assistance.

## Features

- **Process Selected Text** - Transform selected text with AI prompts
- **Process Active Note** - Send entire note to AI, insert result or create new note
- **Insert at Cursor** - Generate AI content at cursor position
- **Create New Note** - Generate AI content as a new note with frontmatter

## Installation

1. Download `main.js` and `manifest.json` from [latest release](https://github.com/cloonix/obsidian-openrouter-integration/releases)
2. Create folder: `.obsidian/plugins/openrouter-ai-assistant/`
3. Copy both files into this folder
4. Reload Obsidian and enable the plugin

## Setup

1. Get an API key from [OpenRouter](https://openrouter.ai/keys)
2. Open plugin settings in Obsidian
3. Paste your API key
4. Configure model and other settings (optional)

## Usage

All commands are available via Command Palette (`Ctrl/Cmd+P`):

- **Process selected text with AI** - Select text → Run command → Enter prompt → Selection replaced with AI response
- **Process active note with AI** - Open note → Run command → Enter prompt → Choose insert location
- **Insert AI response at cursor** - Position cursor → Run command → Enter prompt → Content inserted
- **Create new note with AI response** - Run command → Enter prompt → New note created

## Settings

- **API Key** - Your OpenRouter API key (required)
- **Model** - AI model to use (default: `openai/gpt-4o-mini`)
- **Temperature** - Response randomness, 0-1 (default: 0.7)
- **Max Tokens** - Maximum response length (default: 1000)
- **System Prompt** - Optional default instructions
- **Output Folder** - Where to save AI-generated notes

Popular models: `openai/gpt-4o-mini`, `openai/gpt-4o`, `anthropic/claude-3-5-sonnet`, `meta-llama/llama-3.1-70b-instruct`

See all models at [OpenRouter Models](https://openrouter.ai/models)

## Privacy

- API key stored locally in Obsidian
- Content only sent when you trigger commands
- No automatic data collection (by the plugin)
- Only selected text/note content sent to OpenRouter

## Building from Source

```bash
npm install
npm run build
```

## License

MIT License

## Links

- [OpenRouter](https://openrouter.ai/)
- [Issues](https://github.com/cloonix/obsidian-openrouter-integration/issues)
- [Obsidian](https://obsidian.md/)
