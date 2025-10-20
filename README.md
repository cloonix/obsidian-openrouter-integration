# OpenRouter AI Assistant for Obsidian

An Obsidian plugin that integrates OpenRouter's AI API, allowing you to process text, generate content, and enhance your notes with AI assistance directly within Obsidian.

## Features

- **Process Selected Text**: Select any text in your notes and transform it with AI
- **Process Active Note**: Send your entire note to AI for analysis, summarization, or transformation
- **Insert at Cursor**: Generate AI content and insert it at your current cursor position
- **Create New Note**: Generate AI content and automatically create a new note with proper frontmatter
- **Flexible Configuration**: Customize model, temperature, max tokens, system prompts, and output folders
- **Privacy-Focused**: Your API key is stored locally; content is only sent when you explicitly trigger commands

## Installation

### Manual Installation

1. Download `main.js` and `manifest.json` from the latest release
2. Create a folder in your vault: `.obsidian/plugins/openrouter-ai-assistant/`
3. Copy both files into this folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

### Building from Source

```bash
npm install
npm run build
```

## Setup

### 1. Get Your OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy your key (starts with `sk-or-...`)

### 2. Configure the Plugin

1. Open Obsidian Settings
2. Navigate to **Community Plugins** → **OpenRouter AI Assistant**
3. Paste your API key into the **OpenRouter API Key** field
4. (Optional) Click **Test Connection** to verify your key works
5. Configure other settings as desired:
   - **Model**: Choose your preferred AI model (default: `openai/gpt-4o-mini`)
   - **Temperature**: Control randomness (0 = focused, 1 = creative)
   - **Max Tokens**: Maximum response length
   - **System Prompt**: Default instructions for all AI requests
   - **Output Folder**: Where to save AI-generated notes

## Usage

### Command: Process Selected Text

1. Select text in your note
2. Open Command Palette (`Ctrl/Cmd+P`)
3. Run: **Process selected text with AI**
4. Enter your prompt (e.g., "Summarize this text")
5. The selection will be replaced with the AI response

**Example Use Cases:**
- "Summarize this in 3 bullet points"
- "Translate to Spanish"
- "Rewrite this in a professional tone"
- "Fix grammar and spelling"

### Command: Process Active Note

1. Open a note you want to process
2. Open Command Palette (`Ctrl/Cmd+P`)
3. Run: **Process active note with AI**
4. Enter your prompt (e.g., "Create a summary")
5. Choose where to insert the result:
   - **Insert at cursor**: Adds response at your current position
   - **Create new note**: Creates a new note with the response

**Example Use Cases:**
- "Generate a table of contents for this note"
- "Create study questions from this content"
- "Extract key insights and action items"

### Command: Insert AI Response at Cursor

1. Position your cursor where you want content
2. Open Command Palette (`Ctrl/Cmd+P`)
3. Run: **Insert AI response at cursor**
4. Enter your prompt (e.g., "Write an introduction about...")
5. AI-generated content appears at cursor position

**Example Use Cases:**
- "Write an introduction about machine learning"
- "Generate 5 ideas for blog posts about productivity"
- "Create a markdown table comparing X and Y"

### Command: Create New Note with AI

1. Open Command Palette (`Ctrl/Cmd+P`)
2. Run: **Create new note with AI response**
3. Enter your prompt (e.g., "Write a guide on...")
4. A new note is created with:
   - Frontmatter including AI model, timestamp, and prompt
   - AI-generated content
   - Automatic filename with timestamp

**Example Use Cases:**
- "Write a daily reflection template"
- "Create a project planning checklist"
- "Generate meeting notes template"

## Settings Reference

### OpenRouter API Key
Your API key from OpenRouter. Required for all AI features.

### Model
The AI model to use for requests. Popular options:
- `openai/gpt-4o-mini` (fast, cost-effective)
- `openai/gpt-4o` (more capable, higher cost)
- `anthropic/claude-3-5-sonnet` (excellent for writing)
- `meta-llama/llama-3.1-70b-instruct` (open source)

See [OpenRouter Models](https://openrouter.ai/models) for the full list.

### Temperature
Controls response randomness:
- **0**: Deterministic and focused
- **0.7**: Balanced (default)
- **1**: Creative and varied

### Max Tokens
Maximum length of AI responses. Higher values allow longer responses but cost more.
- Default: 1000
- Recommended range: 500-2000

### System Prompt
Optional default instructions applied to all requests. Example:
```
You are a helpful assistant that writes concise, clear responses in markdown format.
```

### Output Folder
Folder path for AI-generated notes. Leave empty to save in vault root.
- Example: `AI Notes`
- Example: `Daily/AI Generated`

## Privacy & Security

- **API Key Storage**: Your OpenRouter API key is stored locally in Obsidian's plugin data. It never leaves your device except when making authenticated API requests.
- **Data Transmission**: Text is only sent to OpenRouter when you explicitly trigger a command. No automatic or background data collection occurs.
- **What's Sent**: Only the text you select or the active note content, along with your prompt.
- **What's Not Sent**: Vault structure, filenames, or other notes are never transmitted.

## Troubleshooting

### "API key is not configured"
- Go to Settings → OpenRouter AI Assistant
- Enter your API key from https://openrouter.ai/keys
- Click "Test Connection" to verify

### "Invalid API key"
- Double-check your API key is correct
- Ensure you copied the entire key (starts with `sk-or-`)
- Verify your account has credits at OpenRouter

### "Rate limit exceeded"
- You've made too many requests in a short time
- Wait a few moments and try again
- Consider upgrading your OpenRouter plan

### "API returned empty content"
- Try increasing Max Tokens in settings
- Simplify your prompt
- Try a different model

### Build Errors
If building from source:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Development

### Project Structure
```
openrouter-ai-assistant/
├── main.ts                 # Main plugin class
├── types.ts                # TypeScript interfaces
├── openrouter-service.ts   # API client
├── prompt-modal.ts         # Prompt input UI
├── manifest.json           # Plugin metadata
├── package.json            # Dependencies
└── esbuild.config.mjs      # Build configuration
```

### Build Commands
```bash
npm run dev      # Development mode with watch
npm run build    # Production build
npm version      # Bump version
```

### Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Models & Pricing

OpenRouter provides access to various AI models with different capabilities and pricing. Check [OpenRouter Pricing](https://openrouter.ai/models) for current rates.

**Popular Models:**
- GPT-4o Mini: Fast, affordable, great for most tasks
- Claude 3.5 Sonnet: Excellent for long-form writing
- GPT-4o: Most capable OpenAI model
- Llama 3.1 70B: Open source, cost-effective

## Support

- **Issues**: Report bugs at [GitHub Issues](https://github.com/yourusername/openrouter-ai-assistant/issues)
- **OpenRouter Support**: https://openrouter.ai/docs
- **Obsidian Forum**: Share feedback in the Obsidian community

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built for [Obsidian](https://obsidian.md/)
- Powered by [OpenRouter](https://openrouter.ai/)
- Based on the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

---

**Version**: 1.0.0
**Author**: Claus
**Requires**: Obsidian v0.15.0+
