import { EditorState, Extension } from '@codemirror/state';
import {
	EditorView,
	keymap,
	placeholder,
} from '@codemirror/view';
import {
	defaultKeymap,
	historyKeymap,
	history,
} from '@codemirror/commands';
import {
	autocompletion,
	CompletionSource,
} from '@codemirror/autocomplete';
import {
	drawSelection,
	dropCursor,
} from '@codemirror/view';
import {
	indentOnInput,
	bracketMatching,
} from '@codemirror/language';

/**
 * Base configuration options for all CodeMirror editors
 */
export interface BaseEditorOptions {
	/** Initial document content */
	doc?: string;
	/** Placeholder text when doc is empty */
	placeholder?: string;
	/** Whether the editor is editable */
	editable?: boolean;
	/** Callback when content changes */
	onChange?: (value: string) => void;
	/** Custom extensions (autocompletion, themes, decorators, etc.) */
	extensions?: Extension[];
}

/**
 * Base interface for all CodeMirror editor instances
 */
export interface BaseEditorInstance {
	/** The CodeMirror EditorView instance */
	view: EditorView;
	/** Set content programmatically */
	setContent: (content: string) => void;
	/** Get current content */
	getContent: () => string;
	/** Focus the editor */
	focus: () => void;
	/** Destroy the editor */
	destroy: () => void;
}

/**
 * Base class for CodeMirror editors providing common functionality
 */
export abstract class BaseEditor {
	protected view: EditorView | null = null;
	protected isInternalChange = false;
	protected options: BaseEditorOptions;

	constructor(
		protected container: HTMLElement,
		options: BaseEditorOptions = {},
	) {
		this.options = {
			doc: '',
			placeholder: '',
			editable: true,
			extensions: [],
			...options,
		};
	}

	/**
	 * Initialize the editor with extensions
	 */
	protected initialize(): void {
		const extensions = this.buildExtensions();
		const content = this.processInitialContent(
			this.options.doc || '',
		);

		const state = EditorState.create({
			doc: content,
			extensions,
		});

		this.view = new EditorView({
			state,
			parent: this.container,
		});
	}

	/**
	 * Build the extensions array - to be overridden by subclasses
	 */
	protected abstract buildExtensions(): Extension[];

	/**
	 * Process initial content - can be overridden by subclasses
	 */
	protected processInitialContent(content: string): string {
		return content;
	}

	/**
	 * Get base extensions common to all editors
	 */
	protected getBaseExtensions(): Extension[] {
		const extensions: Extension[] = [
			// Core editor features
			drawSelection(),
			dropCursor(),
			indentOnInput(),
			bracketMatching(),
			history(),

			// Basic keymaps
			keymap.of([...defaultKeymap, ...historyKeymap]),

			// Editor settings
			EditorView.editable.of(this.options.editable ?? true),
		];

		// Add placeholder if provided
		if (this.options.placeholder) {
			extensions.push(
				placeholder(this.options.placeholder),
			);
		}

		// Add change listener if onChange is provided
		if (this.options.onChange) {
			extensions.push(
				EditorView.updateListener.of((update) => {
					if (update.docChanged && !this.isInternalChange) {
						const newValue = update.state.doc.toString();
						this.options.onChange!(newValue);
					}
				}),
			);
		}

		// Add custom extensions
		if (this.options.extensions) {
			extensions.push(...this.options.extensions);
		}

		return extensions;
	}

	/**
	 * Set content programmatically
	 */
	setContent(newContent: string): void {
		if (this.view) {
			this.isInternalChange = true;
			const currentDoc = this.view.state.doc;
			const processedContent =
				this.processContentUpdate(newContent);
			this.view.dispatch({
				changes: {
					from: 0,
					to: currentDoc.length,
					insert: processedContent,
				},
				selection: this.getSelectionAfterContentUpdate(
					processedContent,
				),
			});
			this.isInternalChange = false;
		}
	}

	/**
	 * Process content before updating - can be overridden by subclasses
	 */
	protected processContentUpdate(content: string): string {
		return content;
	}

	/**
	 * Get selection position after content update - can be overridden by subclasses
	 */
	protected getSelectionAfterContentUpdate(
		content: string,
	): { anchor: number; head: number } {
		return { anchor: 0, head: 0 };
	}

	/**
	 * Get current content
	 */
	getContent(): string {
		return this.view ? this.view.state.doc.toString() : '';
	}

	/**
	 * Focus the editor
	 */
	focus(): void {
		if (this.view) {
			this.view.focus();
		}
	}

	/**
	 * Destroy the editor
	 */
	destroy(): void {
		if (this.view) {
			this.view.destroy();
			this.view = null;
		}
	}

	/**
	 * Get the view instance (for advanced operations)
	 */
	getView(): EditorView | null {
		return this.view;
	}
}

/**
 * Factory function type for creating editor instances
 */
export type EditorFactory<T extends BaseEditorInstance> = (
	container: HTMLElement,
	options?: any,
) => T;

/**
 * Common utility functions for editor theme styling
 */
export const EditorThemeUtils = {
	/**
	 * Base theme properties that can be shared across editors
	 */
	getBaseThemeProperties() {
		return {
			'.cm-focused': {
				outline: 'none',
			},
			'.cm-focused .cm-content': {
				outline: 'none',
			},
			'.cm-scroller': {
				outline: 'none',
				fontFamily: 'inherit',
			},
			'.cm-tooltip': {
				backgroundColor: 'hsl(var(--popover))',
				border: '1px solid hsl(var(--border))',
				borderRadius: '4px',
				padding: '4px 8px',
				fontSize: '12px',
				maxWidth: '300px',
				wordWrap: 'break-word',
			},
		};
	},

	/**
	 * Cursor styling that can be reused
	 */
	getCursorTheme() {
		return {
			'.cm-cursor': {
				borderLeft:
					'2px solid hsl(var(--foreground)) !important',
				animation: 'blink 1s step-end infinite !important',
			},
		};
	},
};
