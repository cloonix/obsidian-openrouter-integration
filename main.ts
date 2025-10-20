import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { OpenRouterSettings, DEFAULT_SETTINGS, OpenRouterRequest } from './types';
import { OpenRouterService } from './openrouter-service';
import { PromptModal } from './prompt-modal';

export default class OpenRouterPlugin extends Plugin {
	settings: OpenRouterSettings;
	openRouterService: OpenRouterService;
	private isProcessing: boolean = false;

	async onload() {
		await this.loadSettings();

		// Initialize OpenRouter service
		this.openRouterService = new OpenRouterService(this.settings.apiKey);

		// Command: Process Selected Text
		this.addCommand({
			id: 'process-selected-text',
			name: 'AI: Process selected text',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				const selection = editor.getSelection();
				if (!selection || selection.trim() === '') {
					new Notice('Please select some text first.');
					return;
				}

				new PromptModal(this.app, async (prompt) => {
					await this.processText(selection, prompt, (result) => {
						editor.replaceSelection(result);
					});
				}, 'Process Selected Text').open();
			}
		});

		// Command: Process Active Note
		this.addCommand({
			id: 'process-active-note',
			name: 'AI: Process active note',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						const editor = markdownView.editor;
						const content = editor.getValue();

						if (!content || content.trim() === '') {
							new Notice('The active note is empty.');
							return;
						}

						new PromptModal(this.app, async (prompt) => {
							await this.processText(content, prompt, async (result) => {
								// Ask user how to handle the result
								const choice = await this.showResultActionModal(result);
								if (choice === 'cursor') {
									const cursor = editor.getCursor();
									editor.replaceRange('\n\n' + result, cursor);
								} else if (choice === 'new-note') {
									await this.createNewNote(result, prompt);
								}
							});
						}, 'Process Active Note').open();
					}
					return true;
				}
				return false;
			}
		});

		// Command: Insert AI Response at Cursor
		this.addCommand({
			id: 'insert-at-cursor',
			name: 'AI: Insert at cursor',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				new PromptModal(this.app, async (prompt) => {
					await this.processText('', prompt, (result) => {
						const cursor = editor.getCursor();
						editor.replaceRange(result, cursor);
					});
				}, 'Generate AI Content').open();
			}
		});

		// Command: Create New Note with AI
		this.addCommand({
			id: 'create-new-note',
			name: 'AI: Create new note',
			callback: () => {
				new PromptModal(this.app, async (prompt) => {
					await this.processText('', prompt, async (result) => {
						await this.createNewNote(result, prompt);
					});
				}, 'Generate New Note').open();
			}
		});

		// Add settings tab
		this.addSettingTab(new OpenRouterSettingTab(this.app, this));

		// Register context menu for editor
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				// Add "Process selected text" if text is selected
				const selection = editor.getSelection();
				if (selection && selection.trim() !== '') {
					menu.addItem((item) => {
						item
							.setTitle('AI: Process selected text')
							.setIcon('sparkles')
							.onClick(async () => {
								new PromptModal(this.app, async (prompt) => {
									await this.processText(selection, prompt, (result) => {
										editor.replaceSelection(result);
									});
								}, 'Process Selected Text').open();
							});
					});
				}

				// Always add "Process active note"
				menu.addItem((item) => {
					item
						.setTitle('AI: Process active note')
						.setIcon('file-text')
						.onClick(async () => {
							const content = editor.getValue();
							if (!content || content.trim() === '') {
								new Notice('The active note is empty.');
								return;
							}

							new PromptModal(this.app, async (prompt) => {
								await this.processText(content, prompt, async (result) => {
									const choice = await this.showResultActionModal(result);
									if (choice === 'cursor') {
										const cursor = editor.getCursor();
										editor.replaceRange('\n\n' + result, cursor);
									} else if (choice === 'new-note') {
										await this.createNewNote(result, prompt);
									}
								});
							}, 'Process Active Note').open();
						});
				});
			})
		);
	}

	onunload() {
		// Cleanup
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update service with new API key
		this.openRouterService.updateApiKey(this.settings.apiKey);
	}

	private async processText(
		text: string,
		prompt: string,
		onSuccess: (result: string) => void | Promise<void>
	): Promise<void> {
		// Guard against concurrent requests
		if (this.isProcessing) {
			new Notice('Another AI request is already in progress. Please wait...');
			return;
		}

		this.isProcessing = true;
		const notice = new Notice('Processing with AI...', 0);

		try {
			// Build messages array
			const messages = [];

			// Add system prompt if configured
			if (this.settings.systemPrompt && this.settings.systemPrompt.trim() !== '') {
				messages.push({
					role: 'system' as const,
					content: this.settings.systemPrompt
				});
			}

			// Add user message
			if (text && text.trim() !== '') {
				messages.push({
					role: 'user' as const,
					content: `${prompt}\n\n${text}`
				});
			} else {
				messages.push({
					role: 'user' as const,
					content: prompt
				});
			}

			// Build request
			const request: OpenRouterRequest = {
				model: this.settings.model,
				messages: messages,
				temperature: this.settings.temperature,
				max_tokens: this.settings.maxTokens
			};

			// Send request
			const result = await this.openRouterService.sendRequest(request);

			// Hide loading notice
			notice.hide();
			new Notice('AI response received!');

			// Execute success callback
			await onSuccess(result);

		} catch (error) {
			notice.hide();
			if (error instanceof Error) {
				new Notice(`Error: ${error.message}`, 8000);
			} else {
				new Notice('An unexpected error occurred.', 5000);
			}
		} finally {
			this.isProcessing = false;
		}
	}

	private async createNewNote(content: string, promptContext: string): Promise<void> {
		try {
			// Generate filename with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
			const filename = `AI-Note-${timestamp}.md`;

			// Determine folder path
			const folderPath = this.settings.outputFolder || '';
			const fullPath = folderPath ? `${folderPath}/${filename}` : filename;

			// Create frontmatter
			const frontmatter = [
				'---',
				'ai: openrouter',
				`model: ${this.settings.model}`,
				`created: ${new Date().toISOString()}`,
				`prompt: "${promptContext.replace(/"/g, '\\"')}"`,
				'---',
				''
			].join('\n');

			const fullContent = frontmatter + content;

			// Create the file
			const file = await this.app.vault.create(fullPath, fullContent);

			// Open the new note
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);

			new Notice(`Created new note: ${filename}`);

		} catch (error) {
			if (error instanceof Error) {
				new Notice(`Failed to create note: ${error.message}`);
			} else {
				new Notice('Failed to create note.');
			}
		}
	}

	private async showResultActionModal(result: string): Promise<'cursor' | 'new-note' | 'cancel'> {
		return new Promise((resolve) => {
			const modal = new ResultActionModal(
				this.app,
				result,
				(action) => resolve(action)
			);
			modal.open();
		});
	}
}

// Modal for choosing how to handle results from processing active note
class ResultActionModal extends PromptModal {
	private result: string;
	private onChoose: (action: 'cursor' | 'new-note' | 'cancel') => void;

	constructor(app: App, result: string, onChoose: (action: 'cursor' | 'new-note' | 'cancel') => void) {
		super(app, () => { }, 'AI Response Ready');
		this.result = result;
		this.onChoose = onChoose;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('p', { text: 'AI response generated. How would you like to proceed?' });

		// Preview of result (first 200 chars)
		const preview = this.result.slice(0, 200) + (this.result.length > 200 ? '...' : '');
		const previewEl = contentEl.createEl('div', {
			attr: {
				style: 'background: var(--background-secondary); padding: 1em; margin: 1em 0; border-radius: 4px; max-height: 150px; overflow-y: auto; font-family: var(--font-monospace); font-size: 0.9em; white-space: pre-wrap;'
			}
		});
		previewEl.textContent = preview;

		// Buttons container
		const buttonContainer = contentEl.createDiv({
			attr: { style: 'display: flex; gap: 0.5em; justify-content: flex-end; margin-top: 1em;' }
		});

		// Insert at cursor button
		const cursorButton = buttonContainer.createEl('button', {
			text: 'Insert at cursor',
			cls: 'mod-cta'
		});
		cursorButton.addEventListener('click', () => {
			this.close();
			this.onChoose('cursor');
		});

		// Create new note button
		const newNoteButton = buttonContainer.createEl('button', {
			text: 'Create new note'
		});
		newNoteButton.addEventListener('click', () => {
			this.close();
			this.onChoose('new-note');
		});

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
			this.onChoose('cancel');
		});
	}
}

// Settings Tab
class OpenRouterSettingTab extends PluginSettingTab {
	plugin: OpenRouterPlugin;

	constructor(app: App, plugin: OpenRouterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'OpenRouter AI Assistant Settings' });

		// API Key
		new Setting(containerEl)
			.setName('OpenRouter API Key')
			.setDesc('Enter your OpenRouter API key. Get one at https://openrouter.ai')
			.addText(text => text
				.setPlaceholder('sk-or-...')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				})
				.inputEl.setAttribute('type', 'password'));

		// Test connection button
		new Setting(containerEl)
			.setName('Test API Connection')
			.setDesc('Verify your API key works correctly')
			.addButton(button => button
				.setButtonText('Test Connection')
				.onClick(async () => {
					button.setButtonText('Testing...');
					button.setDisabled(true);
					const success = await this.plugin.openRouterService.testConnection();
					if (success) {
						new Notice('API connection successful!');
					}
					button.setButtonText('Test Connection');
					button.setDisabled(false);
				}));

		// Model
		new Setting(containerEl)
			.setName('Model')
			.setDesc('OpenRouter model ID (e.g., openai/gpt-4o-mini, anthropic/claude-3-5-sonnet)')
			.addText(text => text
				.setPlaceholder('openai/gpt-4o-mini')
				.setValue(this.plugin.settings.model)
				.onChange(async (value) => {
					this.plugin.settings.model = value;
					await this.plugin.saveSettings();
				}));

		// Temperature
		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Controls randomness (0 = focused, 1 = creative)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.temperature)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.temperature = value;
					await this.plugin.saveSettings();
				}));

		// Max Tokens
		new Setting(containerEl)
			.setName('Max Tokens')
			.setDesc('Maximum length of AI response (higher = longer responses, more cost)')
			.addText(text => text
				.setPlaceholder('1000')
				.setValue(String(this.plugin.settings.maxTokens))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.maxTokens = num;
						await this.plugin.saveSettings();
					}
				}));

		// System Prompt
		new Setting(containerEl)
			.setName('System Prompt')
			.setDesc('Optional: Default instructions for the AI (applied to all requests)')
			.addTextArea(text => text
				.setPlaceholder('You are a helpful assistant...')
				.setValue(this.plugin.settings.systemPrompt)
				.onChange(async (value) => {
					this.plugin.settings.systemPrompt = value;
					await this.plugin.saveSettings();
				})
				.inputEl.setAttribute('rows', '4'));

		// Output Folder
		new Setting(containerEl)
			.setName('Output Folder')
			.setDesc('Folder path for new AI-generated notes (leave empty for vault root)')
			.addText(text => text
				.setPlaceholder('AI Notes')
				.setValue(this.plugin.settings.outputFolder)
				.onChange(async (value) => {
					this.plugin.settings.outputFolder = value;
					await this.plugin.saveSettings();
				}));

		// Privacy notice
		containerEl.createEl('div', {
			attr: { style: 'margin-top: 2em; padding: 1em; background: var(--background-secondary); border-radius: 4px;' }
		}).createEl('p', {
			text: 'Privacy Note: When you use AI commands, the selected text or note content is sent to OpenRouter. Your API key is stored locally and never shared. No other data is collected or transmitted.',
			attr: { style: 'margin: 0; font-size: 0.9em; color: var(--text-muted);' }
		});
	}
}
