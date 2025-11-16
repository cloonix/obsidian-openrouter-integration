import { App, Modal } from 'obsidian';
import { ScanResult } from './content-scanner';

// Import shared styles
const STYLES = {
	BUTTON_CONTAINER: 'display: flex; gap: 0.5em; justify-content: flex-end; margin-top: 1.5em;'
} as const;

export class SecurityWarningModal extends Modal {
	private scanResult: ScanResult;
	private onConfirm: () => void;
	private onCancel: () => void;

	constructor(app: App, scanResult: ScanResult, onConfirm: () => void, onCancel: () => void) {
		super(app);
		this.scanResult = scanResult;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Title
		contentEl.createEl('h2', { text: '⚠️ Sensitive Content Detected' });

		// Warning message
		contentEl.createEl('p', {
			text: 'Potentially sensitive information was detected in your content. Sending this to an AI service may pose a security risk.',
			attr: { style: 'margin-bottom: 1em;' }
		});

		// Summary
		const summary = this.getSummary();
		const summaryEl = contentEl.createEl('div', {
			attr: {
				style: 'background: var(--background-secondary); padding: 1em; margin: 1em 0; border-radius: 4px; border-left: 3px solid var(--interactive-accent);'
			}
		});
		summaryEl.createEl('strong', { text: 'Detected:' });
		summaryEl.createEl('br');
		summary.forEach(item => {
			summaryEl.createEl('div', {
				text: `• ${item}`,
				attr: { style: 'margin-left: 1em; margin-top: 0.5em;' }
			});
		});

		// Matches list
		if (this.scanResult.matches.length > 0) {
			const matchesEl = contentEl.createEl('details', {
				attr: {
					style: 'margin: 1em 0;',
					'aria-label': 'Detected security patterns details'
				}
			});
			matchesEl.createEl('summary', {
				text: `View ${this.scanResult.matches.length} detected pattern${this.scanResult.matches.length > 1 ? 's' : ''}`,
				attr: {
					style: 'cursor: pointer; color: var(--text-muted);',
					'aria-label': 'Toggle pattern details'
				}
			});

			const matchesList = matchesEl.createEl('div', {
				attr: {
					style: 'background: var(--background-primary-alt); padding: 0.5em; margin-top: 0.5em; border-radius: 4px; max-height: 200px; overflow-y: auto; font-family: var(--font-monospace); font-size: 0.9em;'
				}
			});

			this.scanResult.matches.slice(0, 10).forEach((match, i) => {
				const matchDiv = matchesList.createEl('div', {
					attr: { style: 'margin: 0.5em 0; padding: 0.5em; background: var(--background-secondary);' }
				});
				matchDiv.createEl('div', {
					text: `${i + 1}. ${match.type}`,
					attr: { style: 'font-weight: bold; color: var(--text-error);' }
				});
				matchDiv.createEl('div', {
					text: `Pattern: ${match.pattern}`,
					attr: { style: 'color: var(--text-muted); font-size: 0.9em;' }
				});
			});

			if (this.scanResult.matches.length > 10) {
				matchesList.createEl('div', {
					text: `... and ${this.scanResult.matches.length - 10} more`,
					attr: { style: 'margin-top: 0.5em; font-style: italic; color: var(--text-muted);' }
				});
			}
		}

		// Recommendation
		contentEl.createEl('p', {
			text: 'Recommendation: Review your content and remove any sensitive information before proceeding.',
			attr: { style: 'margin: 1em 0; font-style: italic; color: var(--text-muted);' }
		});

		// Buttons
		const buttonContainer = contentEl.createEl('div', {
			attr: { style: STYLES.BUTTON_CONTAINER }
		});

		// Cancel button
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			attr: { 'aria-label': 'Cancel request and return to editing' }
		});
		cancelButton.addEventListener('click', () => {
			this.close();
			this.onCancel();
		});

		// Continue anyway button
		const continueButton = buttonContainer.createEl('button', {
			text: 'Continue Anyway',
			cls: 'mod-warning',
			attr: { 'aria-label': 'Proceed with request despite security warning' }
		});
		continueButton.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});

		// Focus cancel button by default
		cancelButton.focus();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private getSummary(): string[] {
		const typeCount = this.scanResult.matches.reduce((acc, match) => {
			acc[match.type] = (acc[match.type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		return Object.entries(typeCount).map(
			([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`
		);
	}
}
