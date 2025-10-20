# Bill of Quantities (BOQ) - OpenRouter AI Plugin for Obsidian

## Project Overview
**Plugin Name:** OpenRouter AI Assistant
**Purpose:** Integrate OpenRouter API into Obsidian for AI-powered text processing
**API Provider:** OpenRouter (https://openrouter.ai)
**Target Platform:** Obsidian Desktop & Mobile

---

## 0. Scope, Assumptions, and Definition of Done

### 0.1 In Scope
- Commands to process selected text, process entire note, insert at cursor, and create new note from AI response.
- Settings to store API key, default model, and basic generation parameters.
- Non-streaming request/response via OpenRouter Chat Completions API.
- Desktop and mobile compatibility (no desktop-only APIs).

### 0.2 Out of Scope (v1)
- Tool calling, images, file uploads, multi-turn conversation history beyond a single request.
- Streaming UI; advanced prompt/template management UI.
- External telemetry/analytics or cloud storage.

### 0.3 Assumptions
- User supplies their own OpenRouter API key and accepts OpenRouter terms.
- Vault content may be sent to OpenRouter only when user explicitly triggers a command.
- Network access is available when using AI features; plugin remains idle/offline otherwise.
- Obsidian version ≥ v1.9.0 (per manifest) and Node.js ≥ 24 for development environment.

### 0.4 Definition of Done (DoD)
- All core requirements in Section 1 implemented and covered by manual test cases in Section 5.
- Commands are visible in Command Palette with clear names and stable IDs.
- Settings tab present; API key masked; changes persist and validate.
- Error states produce clear, actionable notices (missing key, network, API errors).
- Build succeeds with `npm run build`; `main.js`, `manifest.json`, `styles.css` (if any) can be copied to a vault and work on desktop and mobile.
- README updated with setup and usage; version bumped and `versions.json` updated for release.

## 1. Core Requirements

### 1.1 API Integration
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 1.1.1 | OpenRouter API client service | ⬜ Not Started | Uses fetch() for HTTP requests |
| 1.1.2 | API endpoint configuration | ⬜ Not Started | Base URL: https://openrouter.ai/api/v1/chat/completions |
| 1.1.3 | Bearer token authentication | ⬜ Not Started | Authorization header with API key |
| 1.1.4 | Request/response handler | ⬜ Not Started | JSON format, message array structure |
| 1.1.5 | Error handling & retries | ⬜ Not Started | Network errors, API errors, rate limits |
| 1.1.6 | Model parameter support | ⬜ Not Started | Default: openai/gpt-4o-mini |

### 1.2 Plugin Settings
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 1.2.1 | Settings interface definition | ⬜ Not Started | TypeScript interface for plugin config |
| 1.2.2 | API key storage | ⬜ Not Started | Secure password field, persisted locally |
| 1.2.3 | Model selection input | ⬜ Not Started | Text input for model ID |
| 1.2.4 | API key validation | ⬜ Not Started | Test connection on save |
| 1.2.5 | Default prompt templates | ⬜ Not Started | Optional: pre-configured prompts |
| 1.2.6 | Settings UI implementation | ⬜ Not Started | PluginSettingTab class |
| 1.2.7 | Temperature slider | ⬜ Not Started | Range 0–1 (default 0.7) |
| 1.2.8 | Max tokens | ⬜ Not Started | Positive integer, sensible cap (e.g., 1,000) |
| 1.2.9 | System prompt | ⬜ Not Started | Optional default system message |
| 1.2.10 | Output folder | ⬜ Not Started | Folder path for new notes |

---

## 2. Feature Implementation

### 2.1 Command: Process Selected Text
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 2.1.1 | Register editor command | ⬜ Not Started | Uses editorCallback |
| 2.1.2 | Get selected text from editor | ⬜ Not Started | editor.getSelection() |
| 2.1.3 | Show prompt input modal | ⬜ Not Started | User enters custom instruction |
| 2.1.4 | Send text + prompt to API | ⬜ Not Started | Combine selection with user prompt |
| 2.1.5 | Display loading indicator | ⬜ Not Started | Notice or status bar update |
| 2.1.6 | Handle API response | ⬜ Not Started | Extract response text |
| 2.1.7 | Replace selection with result | ⬜ Not Started | editor.replaceSelection() |

Acceptance criteria:
- When text is selected and command is run, a prompt modal appears; submitting triggers an API call with the user provided prompt; selection is replaced by assistant text; modal is closed if succeeded
- Option to cancel and close the modal

### 2.2 Command: Process Active Note
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 2.2.1 | Register command | ⬜ Not Started | checkCallback for active view |
| 2.2.2 | Get active note content | ⬜ Not Started | editor.getValue() |
| 2.2.3 | Show prompt input modal | ⬜ Not Started | User enters instruction |
| 2.2.4 | Send full note to API | ⬜ Not Started | May need chunking for large notes |
| 2.2.5 | Display loading indicator | ⬜ Not Started | Notice or status bar |
| 2.2.6 | Handle API response | ⬜ Not Started | Extract response text |
| 2.2.7 | Action selection modal | ⬜ Not Started | Insert at cursor vs new note |

Acceptance criteria:
- With an active markdown editor, running the command opens prompt modal and sends full note contents (or chunks) to API; user can choose to replace content at cursor or create a new note; 
- Large notes are chunked or gracefully rejected with guidance; no UI freeze occurs.
- Option to cancel and close the modal

### 2.3 Command: Insert at Cursor
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 2.3.1 | Get cursor position | ⬜ Not Started | editor.getCursor() |
| 2.3.2 | Insert AI response at cursor | ⬜ Not Started | editor.replaceRange() |
| 2.3.3 | Preserve formatting | ⬜ Not Started | Maintain markdown structure |
| 2.3.4 | Move cursor after insertion | ⬜ Not Started | Optional: position after inserted text |

Acceptance criteria:
- Inserting text respects markdown paragraphs and does not break frontmatter or code blocks if cursor is outside them.

### 2.4 Command: Create New Note
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 2.4.1 | Generate note filename | ⬜ Not Started | Timestamp or prompt-based |
| 2.4.2 | Create new markdown file | ⬜ Not Started | app.vault.create() |
| 2.4.3 | Write AI response to file | ⬜ Not Started | Include metadata/frontmatter |
| 2.4.4 | Open new note | ⬜ Not Started | app.workspace.openLinkText() |
| 2.4.5 | Option: Set default location | ⬜ Not Started | Settings: output folder path |

Acceptance criteria:
- New note is created in configured folder with a timestamped filename or from prompt context; frontmatter includes `ai: openrouter` and `model` used.

---

## 3. User Interface Components

### 3.1 Prompt Input Modal
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 3.1.1 | Modal class definition | ⬜ Not Started | Extends Modal |
| 3.1.2 | Textarea for prompt input | ⬜ Not Started | Multi-line text input |
| 3.1.3 | Submit button handler | ⬜ Not Started | Trigger API call |
| 3.1.4 | Cancel button | ⬜ Not Started | Close modal without action |
| 3.1.5 | Keyboard shortcuts | ⬜ Not Started | Enter to submit, Esc to cancel |
| 3.1.6 | Prompt templates dropdown | ⬜ Not Started | Optional: quick select prompts |

Acceptance criteria:
- Modal autofocuses textarea; Enter submits unless Shift+Enter is used for newline; Esc cancels; validation prevents empty prompt if required.

### 3.2 Loading & Status Indicators
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 3.2.1 | Loading notice display | ⬜ Not Started | "Processing with AI..." |
| 3.2.2 | Status bar progress | ⬜ Not Started | Optional: show API status |
| 3.2.3 | Disable commands during API call | ⬜ Not Started | Prevent duplicate requests |
| 3.2.4 | Success notification | ⬜ Not Started | "AI response inserted" |

Acceptance criteria:
- While in-flight, commands are disabled or a re-entry guard prevents duplicate requests; a clear inline or global indicator is visible; success and error notices are concise and actionable.

### 3.3 Error Handling
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 3.3.1 | API key missing error | ⬜ Not Started | Prompt to configure settings |
| 3.3.2 | Network error handling | ⬜ Not Started | Friendly error message |
| 3.3.3 | API error messages | ⬜ Not Started | Display API error details |
| 3.3.4 | Rate limit handling | ⬜ Not Started | Inform user, suggest retry |
| 3.3.5 | Invalid model error | ⬜ Not Started | Check model format |
| 3.3.6 | Empty response handling | ⬜ Not Started | Handle edge cases |

Acceptance criteria:
- Missing API key shows a settings deep-link; network/API errors surface HTTP code and message safely; rate limit errors advise waiting; invalid model prompts the user to correct settings.

---

## 4. Code Structure

### 4.1 File Organization
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 4.1.1 | main.ts - Plugin class | ⬜ Not Started | Core plugin logic |
| 4.1.2 | openrouter-service.ts | ⬜ Not Started | API client service (optional separate file) |
| 4.1.3 | types.ts | ⬜ Not Started | TypeScript interfaces (optional) |
| 4.1.4 | manifest.json | ⬜ Not Started | Update plugin metadata |
| 4.1.5 | package.json | ⬜ Not Started | Update project info |

Notes:
- Keep `main.ts` focused on lifecycle and command registration; move service logic to `openrouter-service.ts`; UI to `ui/` if folderization is introduced later.

### 4.2 TypeScript Interfaces
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 4.2.1 | OpenRouterSettings interface | ⬜ Not Started | apiKey, model, etc. |
| 4.2.2 | OpenRouterRequest interface | ⬜ Not Started | API request structure |
| 4.2.3 | OpenRouterResponse interface | ⬜ Not Started | API response structure |
| 4.2.4 | PromptTemplate interface | ⬜ Not Started | Optional: saved prompts |

Suggested shapes:
- `OpenRouterSettings`: `{ apiKey: string; model: string; temperature: number; maxTokens: number; systemPrompt?: string; outputFolder?: string }`
- `OpenRouterRequest`: `{ model: string; messages: { role: 'system' | 'user' | 'assistant'; content: string }[]; temperature?: number; max_tokens?: number }`
- `OpenRouterResponse`: `{ choices: { message: { role: string; content: string } }[] }`

---

## 5. Testing & Quality Assurance

### 5.1 Functional Testing
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 5.1.1 | Test: Process selected text | ⬜ Not Started | Various selection sizes |
| 5.1.2 | Test: Process full note | ⬜ Not Started | Small and large notes |
| 5.1.3 | Test: Insert at cursor | ⬜ Not Started | Different cursor positions |
| 5.1.4 | Test: Create new note | ⬜ Not Started | Verify file creation |
| 5.1.5 | Test: Settings persistence | ⬜ Not Started | Save/reload settings |
| 5.1.6 | Test: API key validation | ⬜ Not Started | Valid and invalid keys |
| 5.1.7 | Test: Error scenarios | ⬜ Not Started | Network errors, API errors |

Acceptance criteria for QA:
- All happy-path tests pass across desktop and mobile.
- Error scenarios produce clear, deterministic messages; no unhandled promise rejections in console.

### 5.2 Edge Cases
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 5.2.1 | Empty selection handling | ⬜ Not Started | Show appropriate error |
| 5.2.2 | Empty note handling | ⬜ Not Started | Prevent empty API calls |
| 5.2.3 | Very large text handling | ⬜ Not Started | Token limits, chunking |
| 5.2.4 | Special characters in text | ⬜ Not Started | Unicode, markdown syntax |
| 5.2.5 | Concurrent requests | ⬜ Not Started | Queue or block duplicate calls |

Additional:
- Pluggable chunking strategy for notes exceeding token limits (e.g., summarize-then-continue or split by headings).

---

## 6. Documentation

### 6.1 User Documentation
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 6.1.1 | README.md update | ⬜ Not Started | Installation, setup, usage |
| 6.1.2 | API key setup guide | ⬜ Not Started | How to get OpenRouter key |
| 6.1.3 | Command usage examples | ⬜ Not Started | Screenshots/GIFs optional |
| 6.1.4 | Troubleshooting section | ⬜ Not Started | Common issues and fixes |
| 6.1.5 | Model selection guide | ⬜ Not Started | List popular models |

Acceptance criteria:
- README includes: how to get an OpenRouter API key, where to paste it in settings, examples for all commands, privacy note, and troubleshooting for common errors.

### 6.2 Developer Documentation
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 6.2.1 | CLAUDE.md updates | ⬜ Not Started | Document architecture changes |
| 6.2.2 | Code comments | ⬜ Not Started | Inline documentation |
| 6.2.3 | API integration notes | ⬜ Not Started | OpenRouter specifics |

---

## 7. Release Preparation

### 7.1 Build & Deploy
| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 7.1.1 | Update version in manifest.json | ⬜ Not Started | Semantic versioning |
| 7.1.2 | Update versions.json | ⬜ Not Started | Obsidian compatibility |
| 7.1.3 | Run production build | ⬜ Not Started | npm run build |
| 7.1.4 | Test built plugin | ⬜ Not Started | Load from dist files |
| 7.1.5 | Create GitHub release | ⬜ Not Started | Upload main.js, manifest.json |

---

## 8. Future Enhancements (Optional)

### 8.1 Advanced Features
| Item | Description | Status | Priority |
|------|-------------|--------|----------|
| 8.1.1 | Streaming responses | ⬜ Not Started | Low |
| 8.1.2 | Conversation history | ⬜ Not Started | Medium |
| 8.1.3 | Custom prompt templates | ⬜ Not Started | Medium |
| 8.1.4 | Multiple model support | ⬜ Not Started | High |
| 8.1.5 | Token usage tracking | ⬜ Not Started | Low |
| 8.1.6 | Response caching | ⬜ Not Started | Low |
| 8.1.7 | Batch processing | ⬜ Not Started | Low |
| 8.1.8 | Context menu integration | ⬜ Not Started | Medium |

---

## 9. Non-Functional Requirements

| Item | Description | Status | Notes |
|------|-------------|--------|-------|
| 9.1 | Performance | ⬜ Not Started | No UI freeze; API calls are async; debounce rapid invocations |
| 9.2 | Privacy | ⬜ Not Started | Only send user-selected content or active note on explicit action |
| 9.3 | Security | ⬜ Not Started | API key stored locally via `saveData`; masked in UI; never logged |
| 9.4 | Mobile support | ⬜ Not Started | Avoid desktop-only APIs; validate on iOS/Android |
| 9.5 | Accessibility | ⬜ Not Started | Modal focus management; keyboard shortcuts; readable notices |
| 9.6 | Localization | ⬜ Not Started | English-only copy with future i18n hooks |
| 9.7 | Logging | ⬜ Not Started | No sensitive content in logs; verbose logging behind dev flag |

---

## 10. Security & Data Handling

- API key is stored locally in plugin data and never transmitted except in Authorization header to OpenRouter.
- Do not collect or transmit vault metadata or filenames beyond what the user explicitly sends in prompts.
- Provide a clear privacy note in README and in settings explaining what data is sent when commands are used.
- Rate limit and backoff to avoid thrashing; handle HTTP 429 with retry-after messaging.

---

## 11. Milestones, Estimates, and Acceptance

| Milestone | Scope | Est. | Acceptance |
|-----------|-------|------|------------|
| M1 | API service + settings (key/model/temperature/max tokens/system prompt) | 1–2 days | Test connection works; settings persist; validation notices |
| M2 | Process Selected Text + Insert at Cursor | 1–2 days | Replace selection flow passes QA criteria |
| M3 | Process Active Note + Create New Note | 1–2 days | Chunking or graceful handling; frontmatter added; new note opens |
| M4 | Error handling + UX polish | 0.5–1 day | All error acceptance criteria satisfied |
| M5 | Docs + Release prep | 0.5–1 day | README complete; build green; artifacts load in Obsidian |

Estimates assume familiarity with Obsidian API and no upstream API incidents.

---

## 12. Dependencies, Risks, and Mitigations

- Dependency: OpenRouter API availability and model IDs; Mitigation: configurable model, clear errors.
- Risk: Very large notes exceeding token limits; Mitigation: chunking strategy and user guidance.
- Risk: Mobile performance/permissions; Mitigation: test on mobile and avoid desktop-only APIs.
- Risk: User privacy expectations; Mitigation: clear disclosures and opt-in behavior only.

---

## 13. Open Questions (to confirm)

1. Preferred default model ID? Keep `openai/gpt-4o-mini` or allow user to pick at first run?
2. Should we include streaming in v1 (if OpenRouter supports) or defer to v2?
3. Desired default output folder path for generated notes?
4. Any organization-specific headers (HTTP-Referer/X-Title) to include?

---

## Status Legend
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ❌ Blocked
- ⚠️ Issues Found

---

## Progress Summary

**Total Items:** 80+
**Completed:** 0
**In Progress:** 0
**Not Started:** 80+
**Blocked:** 0

**Overall Progress:** 0%

---

## Notes & Decisions

### Technical Decisions
1. **API Client:** Use native `fetch()` API (no external HTTP libraries needed)
2. **Error Handling:** User-friendly notices for all error states
3. **Settings Storage:** Use Obsidian's built-in `loadData()` / `saveData()`
4. **Mobile Support:** Keep `isDesktopOnly: false` for cross-platform compatibility

### OpenRouter API Details
- **Endpoint:** https://openrouter.ai/api/v1/chat/completions
- **Auth:** Bearer token in Authorization header
- **Default Model:** openai/gpt-4o-mini (configurable)
- **Request Format:** JSON with messages array
- **Response Format:** JSON with choices array

### Development Environment
- **TypeScript:** 4.7.4
- **Build Tool:** esbuild
- **Node Version:** >= 18 (LTS recommended)
- **Target:** ES2018

---

**Last Updated:** 2025-10-20
**Document Version:** 1.1
