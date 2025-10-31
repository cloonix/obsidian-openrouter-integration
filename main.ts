import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { OpenRouterSettings, DEFAULT_SETTINGS, OpenRouterRequest, DEFAULT_CONCISE_PROMPT } from './types';
import { OpenRouterService } from './openrouter-service';
import { PromptModal } from './prompt-modal';
import { ContentScanner } from './content-scanner';
import { SecurityWarningModal } from './security-warning-modal';

export default class OpenRouterPlugin extends Plugin {
	settings: OpenRouterSettings;
	openRouterService: OpenRouterService;
	contentScanner: ContentScanner;
	private isProcessing: boolean = false;
	private statusBarItem: HTMLElement;
	private lastUsedModel: string = '';

	async onload() {
		await this.loadSettings();

		// Initialize OpenRouter service
		this.openRouterService = new OpenRouterService(this.settings.apiKey, {
			enabled: this.settings.enableRateLimiting,
			maxRequestsPerMinute: this.settings.maxRequestsPerMinute
		});

		// Initialize content scanner
		this.contentScanner = new ContentScanner();

		// Add status bar item for rate limit info
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar();

		// Update status bar every 10 seconds
		this.registerInterval(
			window.setInterval(() => this.updateStatusBar(), 10000)
		);

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

				new PromptModal(this.app, async (prompt, modelId) => {
					await this.processText(selection, prompt, (result) => {
						editor.replaceSelection(result);
					}, modelId);
				}, this.settings.models, this.settings.defaultModelId, 'Process Selected Text').open();
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

						new PromptModal(this.app, async (prompt, modelId) => {
							await this.processText(content, prompt, async (result) => {
								// Ask user how to handle the result
								const choice = await this.showResultActionModal(result);
								if (choice === 'replace') {
									editor.setValue(result);
									new Notice('Note replaced with AI response');
								} else if (choice === 'cursor') {
									const cursor = editor.getCursor();
									editor.replaceRange('\n\n' + result, cursor);
								} else if (choice === 'new-note') {
									await this.createNewNote(result, prompt, this.lastUsedModel);
								}
							}, modelId);
						}, this.settings.models, this.settings.defaultModelId, 'Process Active Note').open();
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
				new PromptModal(this.app, async (prompt, modelId) => {
					await this.processText('', prompt, (result) => {
						const cursor = editor.getCursor();
						editor.replaceRange(result, cursor);
					}, modelId);
				}, this.settings.models, this.settings.defaultModelId, 'Generate AI Content').open();
			}
		});

		// Command: Create New Note with AI
		this.addCommand({
			id: 'create-new-note',
			name: 'AI: Create new note',
			callback: () => {
				new PromptModal(this.app, async (prompt, modelId) => {
					await this.processText('', prompt, async (result) => {
						await this.createNewNote(result, prompt, this.lastUsedModel);
					}, modelId);
				}, this.settings.models, this.settings.defaultModelId, 'Generate New Note').open();
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
								new PromptModal(this.app, async (prompt, modelId) => {
									await this.processText(selection, prompt, (result) => {
										editor.replaceSelection(result);
									}, modelId);
								}, this.settings.models, this.settings.defaultModelId, 'Process Selected Text').open();
							});
					});
				}

				// Always add "Insert at cursor"
				menu.addItem((item) => {
					item
						.setTitle('AI: Insert at cursor')
						.setIcon('plus-circle')
						.onClick(async () => {
							new PromptModal(this.app, async (prompt, modelId) => {
								await this.processText('', prompt, (result) => {
									const cursor = editor.getCursor();
									editor.replaceRange(result, cursor);
								}, modelId);
							}, this.settings.models, this.settings.defaultModelId, 'Generate AI Content').open();
						});
				});

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

							new PromptModal(this.app, async (prompt, modelId) => {
								await this.processText(content, prompt, async (result) => {
									const choice = await this.showResultActionModal(result);
									if (choice === 'replace') {
										editor.setValue(result);
										new Notice('Note replaced with AI response');
									} else if (choice === 'cursor') {
										const cursor = editor.getCursor();
										editor.replaceRange('\n\n' + result, cursor);
									} else if (choice === 'new-note') {
										await this.createNewNote(result, prompt, this.lastUsedModel);
									}
								}, modelId);
							}, this.settings.models, this.settings.defaultModelId, 'Process Active Note').open();
						});
				});
			})
		);
	}

	onunload() {
		// Cleanup
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Migration: convert old single model setting to new models array
		if (loadedData && 'model' in loadedData && typeof loadedData.model === 'string') {
			// Old format detected, migrate to new format
			const oldModel = loadedData.model;
			// Check if this model already exists in the default models
			const existingModel = this.settings.models.find(m => m.modelId === oldModel);
			if (!existingModel) {
				// Add the old model as a custom model
				this.settings.models.push({
					id: 'migrated-model',
					name: 'Migrated Model',
					modelId: oldModel
				});
				this.settings.defaultModelId = 'migrated-model';
			} else {
				this.settings.defaultModelId = existingModel.id;
			}
			// Save migrated settings
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update service with new API key (only if service is initialized)
		if (this.openRouterService) {
			this.openRouterService.updateApiKey(this.settings.apiKey);
			// Update rate limit config
			this.openRouterService.updateRateLimitConfig({
				enabled: this.settings.enableRateLimiting,
				maxRequestsPerMinute: this.settings.maxRequestsPerMinute
			});
			// Update status bar
			this.updateStatusBar();
		}
	}

	private updateStatusBar(): void {
		if (!this.settings.enableRateLimiting) {
			this.statusBarItem.setText('');
			return;
		}

		const rateLimiter = this.openRouterService.getRateLimiter();
		const remaining = rateLimiter.getRemainingRequests();
		const max = this.settings.maxRequestsPerMinute;

		if (remaining === 0) {
			const resetTime = rateLimiter.getFormattedResetTime();
			this.statusBarItem.setText(`AI: Rate limited (reset in ${resetTime})`);
			this.statusBarItem.setAttribute('style', 'color: var(--text-error);');
		} else if (remaining <= 3) {
			this.statusBarItem.setText(`AI: ${remaining}/${max} requests`);
			this.statusBarItem.setAttribute('style', 'color: var(--text-warning);');
		} else {
			this.statusBarItem.setText(`AI: ${remaining}/${max} requests`);
			this.statusBarItem.setAttribute('style', 'color: var(--text-muted);');
		}
	}

	private async processText(
		text: string,
		prompt: string,
		onSuccess: (result: string) => void | Promise<void>,
		modelId?: string
	): Promise<void> {
		// Guard against concurrent requests
		if (this.isProcessing) {
			new Notice('Another AI request is already in progress. Please wait...');
			return;
		}

		this.isProcessing = true;
		let notice: Notice | null = null;

		try {
			// Content security scanning
			if (this.settings.enableContentScanning) {
				const contentToScan = text + '\n' + prompt;
				const scanResult = this.contentScanner.scan(contentToScan);

				if (scanResult.hasSensitiveContent) {
					if (this.settings.scanAction === 'block') {
						this.isProcessing = false;
						const summary = this.contentScanner.getSummary(scanResult);
						new Notice(`Request blocked: ${summary}`, 8000);
						return;
					} else if (this.settings.scanAction === 'warn') {
						const userConfirmed = await new Promise<boolean>((resolve) => {
							new SecurityWarningModal(
								this.app,
								scanResult,
								() => resolve(true),
								() => resolve(false)
							).open();
						});

						if (!userConfirmed) {
							this.isProcessing = false;
							new Notice('Request cancelled by user.');
							return;
						}
					}
				}
			}

			notice = new Notice('Processing with AI...', 0);

			// Track start time for elapsed time display
			const startTime = Date.now();

			// Build messages array
			const messages = [];

			// Add system prompt: use custom if set, otherwise use default concise prompt
			const systemPrompt = this.settings.systemPrompt && this.settings.systemPrompt.trim() !== ''
				? this.settings.systemPrompt
				: DEFAULT_CONCISE_PROMPT;

			messages.push({
				role: 'system' as const,
				content: systemPrompt
			});

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

			// Determine which model to use
			let selectedModel: string;
			if (modelId) {
				// User explicitly selected a model
				const model = this.settings.models.find(m => m.id === modelId);
				selectedModel = model ? model.modelId : this.settings.models.find(m => m.id === this.settings.defaultModelId)?.modelId || 'google/gemini-flash-1.5';
			} else {
				// Use default model
				const defaultModel = this.settings.models.find(m => m.id === this.settings.defaultModelId);
				selectedModel = defaultModel ? defaultModel.modelId : 'google/gemini-flash-1.5';
			}

			// Store for use in createNewNote
			this.lastUsedModel = selectedModel;

			// Build request
			const request: OpenRouterRequest = {
				model: selectedModel,
				messages: messages,
				temperature: this.settings.temperature,
				max_tokens: this.settings.maxTokens
			};

			// Send request
			const result = await this.openRouterService.sendRequest(request);

			// Hide loading notice
			notice.hide();

			// Calculate and display elapsed time
			const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
			new Notice(`AI response received! (${elapsedSeconds}s)`);

			// Update status bar to reflect used request
			this.updateStatusBar();

			// Execute success callback
			await onSuccess(result);

		} catch (error) {
			if (notice) {
				notice.hide();
			}
			if (error instanceof Error) {
				new Notice(`Error: ${error.message}`, 8000);
			} else {
				new Notice('An unexpected error occurred.', 5000);
			}
		} finally {
			this.isProcessing = false;
		}
	}

	private async createNewNote(content: string, promptContext: string, modelUsed?: string): Promise<void> {
		try {
			// Generate filename with timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
			const filename = `AI-Note-${timestamp}.md`;

			// Determine folder path
			const folderPath = this.settings.outputFolder || '';
			const fullPath = folderPath ? `${folderPath}/${filename}` : filename;

			// Get model name for frontmatter
			const defaultModel = this.settings.models.find(m => m.id === this.settings.defaultModelId);
			const modelToDisplay = modelUsed || defaultModel?.modelId || 'unknown';

			// Create frontmatter
			const frontmatter = [
				'---',
				'ai: openrouter',
				`model: ${modelToDisplay}`,
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

	private async showResultActionModal(result: string): Promise<'cursor' | 'new-note' | 'replace' | 'cancel'> {
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
class ResultActionModal extends Modal {
	private result: string;
	private onChoose: (action: 'cursor' | 'new-note' | 'replace' | 'cancel') => void;

	constructor(app: App, result: string, onChoose: (action: 'cursor' | 'new-note' | 'replace' | 'cancel') => void) {
		super(app);
		this.result = result;
		this.onChoose = onChoose;
		this.titleEl.setText('AI Response Ready');
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

		// Replace note button
		const replaceButton = buttonContainer.createEl('button', {
			text: 'Replace note',
			cls: 'mod-warning'
		});
		replaceButton.addEventListener('click', () => {
			this.close();
			this.onChoose('replace');
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

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Modal for adding/editing models
class ModelEditModal extends Modal {
	private modelName: string;
	private modelId: string;
	private onSubmit: (name: string, modelId: string) => void;

	constructor(app: App, onSubmit: (name: string, modelId: string) => void, existingName?: string, existingModelId?: string) {
		super(app);
		this.modelName = existingName || '';
		this.modelId = existingModelId || '';
		this.onSubmit = onSubmit;
		this.titleEl.setText(existingName ? 'Edit Model' : 'Add New Model');
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Model name input
		new Setting(contentEl)
			.setName('Model name')
			.setDesc('Display name for the model (e.g., "GPT-4")')
			.addText(text => text
				.setPlaceholder('GPT-4')
				.setValue(this.modelName)
				.onChange(value => this.modelName = value));

		// Model ID input
		new Setting(contentEl)
			.setName('OpenRouter model ID')
			.setDesc('Model identifier from OpenRouter (e.g., "openai/gpt-4")')
			.addText(text => text
				.setPlaceholder('openai/gpt-4')
				.setValue(this.modelId)
				.onChange(value => this.modelId = value));

		// Buttons
		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('Cancel')
				.onClick(() => this.close()))
			.addButton(button => button
				.setButtonText('Save')
				.setCta()
				.onClick(() => {
					if (this.modelName.trim() && this.modelId.trim()) {
						this.onSubmit(this.modelName.trim(), this.modelId.trim());
						this.close();
					} else {
						new Notice('Please fill in both fields');
					}
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
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

		// Models heading
		containerEl.createEl('h3', { text: 'Models', attr: { style: 'margin-top: 2em;' } });

		// Default model selector
		new Setting(containerEl)
			.setName('Default model')
			.setDesc('Select which model to use by default')
			.addDropdown(dropdown => {
				this.plugin.settings.models.forEach(model => {
					dropdown.addOption(model.id, model.name);
				});
				dropdown.setValue(this.plugin.settings.defaultModelId);
				dropdown.onChange(async (value) => {
					this.plugin.settings.defaultModelId = value;
					await this.plugin.saveSettings();
				});
			});

		// Display existing models
		this.plugin.settings.models.forEach((model, index) => {
			new Setting(containerEl)
				.setName(model.name)
				.setDesc(`ID: ${model.modelId}`)
				.addButton(button => button
					.setButtonText('Edit')
					.onClick(() => {
						new ModelEditModal(
							this.app,
							(newName, newModelId) => {
								this.plugin.settings.models[index].name = newName;
								this.plugin.settings.models[index].modelId = newModelId;
								this.plugin.saveSettings();
								this.display(); // Refresh settings UI
							},
							model.name,
							model.modelId
						).open();
					}))
				.addButton(button => button
					.setButtonText('Delete')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.models.splice(index, 1);
						// If deleted model was default, set new default
						if (this.plugin.settings.defaultModelId === model.id) {
							this.plugin.settings.defaultModelId = this.plugin.settings.models[0]?.id || '';
						}
						await this.plugin.saveSettings();
						this.display(); // Refresh settings UI
					}));
		});

		// Add new model button
		new Setting(containerEl)
			.setName('Add new model')
			.setDesc('Add a custom OpenRouter model')
			.addButton(button => button
				.setButtonText('Add Model')
				.setCta()
				.onClick(() => {
					new ModelEditModal(
						this.app,
						(name, modelId) => {
							const id = name.toLowerCase().replace(/\s+/g, '-');
							this.plugin.settings.models.push({ id, name, modelId });
							this.plugin.saveSettings();
							this.display(); // Refresh settings UI
						}
					).open();
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
			.setDesc('Custom instructions for the AI. Leave empty for concise responses (recommended). Add custom instructions to override default behavior.')
			.addTextArea(text => text
				.setPlaceholder('Leave empty for concise responses...')
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

		// Security & Rate Limits heading
		containerEl.createEl('h3', { text: 'Security & Rate Limits', attr: { style: 'margin-top: 2em;' } });

		// Enable Rate Limiting
		new Setting(containerEl)
			.setName('Enable rate limiting')
			.setDesc('Limit the number of API requests to prevent excessive usage')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableRateLimiting)
				.onChange(async (value) => {
					this.plugin.settings.enableRateLimiting = value;
					await this.plugin.saveSettings();
				}));

		// Max Requests Per Minute
		new Setting(containerEl)
			.setName('Max requests per minute')
			.setDesc('Maximum number of API requests allowed per minute (1-60)')
			.addSlider(slider => slider
				.setLimits(1, 60, 1)
				.setValue(this.plugin.settings.maxRequestsPerMinute)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxRequestsPerMinute = value;
					await this.plugin.saveSettings();
				}));

		// Enable Content Scanning
		new Setting(containerEl)
			.setName('Enable content scanning')
			.setDesc('Scan content for potentially sensitive information before sending to AI')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableContentScanning)
				.onChange(async (value) => {
					this.plugin.settings.enableContentScanning = value;
					await this.plugin.saveSettings();
				}));

		// Content Scanning Action
		new Setting(containerEl)
			.setName('When sensitive content detected')
			.setDesc('Choose how to handle potentially sensitive content')
			.addDropdown(dropdown => dropdown
				.addOption('warn', 'Warn and ask for confirmation')
				.addOption('block', 'Block and prevent sending')
				.setValue(this.plugin.settings.scanAction)
				.onChange(async (value: 'warn' | 'block') => {
					this.plugin.settings.scanAction = value;
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
