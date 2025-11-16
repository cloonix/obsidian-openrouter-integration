import { App, Modal } from 'obsidian';
import { ModelConfig } from './types';

// Import shared styles
const STYLES = {
	BUTTON_CONTAINER: 'display: flex; gap: 0.5em; justify-content: flex-end; margin-top: 1em;'
} as const;

export class PromptModal extends Modal {
	private prompt: string = '';
	private selectedModelId: string;
	private onSubmit: (prompt: string, modelId: string) => void;
	private submitButton: HTMLButtonElement | null = null;
	private textArea: HTMLTextAreaElement | null = null;
	private models: ModelConfig[];

	constructor(
		app: App,
		onSubmit: (prompt: string, modelId: string) => void,
		models: ModelConfig[],
		defaultModelId: string,
		title?: string
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.models = models;
		this.selectedModelId = defaultModelId;
		if (title) {
			this.titleEl.setText(title);
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('p', { text: 'Enter your prompt for the AI:' });

		// Model selector
		const modelContainer = contentEl.createDiv({
			attr: { style: 'margin-bottom: 1em;' }
		});

		modelContainer.createEl('label', {
			text: 'Model: ',
			attr: {
				style: 'font-weight: 500; margin-right: 0.5em;',
				for: 'ai-model-select'
			}
		});

		const modelSelect = modelContainer.createEl('select', {
			attr: {
				style: 'padding: 0.3em; font-size: 0.9em;',
				id: 'ai-model-select',
				'aria-label': 'Select AI model'
			}
		});

		// Populate model options
		this.models.forEach(model => {
			const option = modelSelect.createEl('option', {
				text: model.name,
				value: model.id
			});
			if (model.id === this.selectedModelId) {
				option.selected = true;
			}
		});

		modelSelect.addEventListener('change', (e) => {
			this.selectedModelId = (e.target as HTMLSelectElement).value;
		});

		// Create textarea
		const textAreaContainer = contentEl.createDiv();
		this.textArea = textAreaContainer.createEl('textarea', {
			attr: {
				rows: '6',
				placeholder: 'Example: Summarize this text...',
				style: 'width: 100%; margin-bottom: 1em; padding: 0.5em; font-family: inherit; resize: vertical;',
				'aria-label': 'AI prompt input',
				'aria-required': 'true'
			}
		});

		// Auto-focus textarea
		this.textArea.focus();

		// Handle textarea input
		this.textArea.addEventListener('input', (e) => {
			this.prompt = (e.target as HTMLTextAreaElement).value;
			// Enable/disable submit button based on content
			if (this.submitButton) {
				this.submitButton.disabled = this.prompt.trim() === '';
			}
		});

		// Handle Ctrl/Cmd+Enter to submit
		this.textArea.addEventListener('keydown', (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				e.preventDefault();
				this.handleSubmit();
			}
		});

		// Buttons container
		const buttonContainer = contentEl.createDiv({
			attr: { style: STYLES.BUTTON_CONTAINER }
		});

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			attr: { 'aria-label': 'Cancel and close prompt' }
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		// Submit button
		this.submitButton = buttonContainer.createEl('button', {
			text: 'Submit',
			cls: 'mod-cta',
			attr: { 'aria-label': 'Submit prompt to AI' }
		});
		this.submitButton.disabled = true; // Initially disabled
		this.submitButton.addEventListener('click', () => {
			this.handleSubmit();
		});

		// Hint text
		contentEl.createEl('p', {
			text: 'Tip: Press Ctrl/Cmd+Enter to submit',
			attr: { style: 'font-size: 0.9em; color: var(--text-muted); margin-top: 1em;' }
		});
	}

	private handleSubmit() {
		if (this.prompt.trim() !== '') {
			this.close();
			this.onSubmit(this.prompt, this.selectedModelId);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
