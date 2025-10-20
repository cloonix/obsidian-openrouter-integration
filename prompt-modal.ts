import { App, Modal, Setting } from 'obsidian';

export class PromptModal extends Modal {
	private prompt: string = '';
	private onSubmit: (prompt: string) => void;
	private submitButton: HTMLButtonElement | null = null;
	private textArea: HTMLTextAreaElement | null = null;

	constructor(app: App, onSubmit: (prompt: string) => void, title?: string) {
		super(app);
		this.onSubmit = onSubmit;
		if (title) {
			this.titleEl.setText(title);
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('p', { text: 'Enter your prompt for the AI:' });

		// Create textarea
		const textAreaContainer = contentEl.createDiv();
		this.textArea = textAreaContainer.createEl('textarea', {
			attr: {
				rows: '6',
				placeholder: 'Example: Summarize this text...',
				style: 'width: 100%; margin-bottom: 1em; padding: 0.5em; font-family: inherit; resize: vertical;'
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
			attr: { style: 'display: flex; gap: 0.5em; justify-content: flex-end;' }
		});

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		// Submit button
		this.submitButton = buttonContainer.createEl('button', {
			text: 'Submit',
			cls: 'mod-cta'
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
			this.onSubmit(this.prompt);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
