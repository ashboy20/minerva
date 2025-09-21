import React, { useEffect } from 'react'
import { EditorState, Extension, Transaction } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { BaseEditor, BaseEditorOptions, BaseEditorInstance, EditorThemeUtils } from './BaseEditor'

/**
 * Single-line editor implementation extending BaseEditor
 */
class SingleLineEditor extends BaseEditor {
  private singleLineOptions: BaseEditorOptions

  constructor(container: HTMLElement, options: BaseEditorOptions = {}) {
    super(container, options)
    this.singleLineOptions = options
    this.initialize()
  }

  protected buildExtensions(): Extension[] {
    const extensions = [
      // Single-line specific extensions
      EditorState.allowMultipleSelections.of(true),
      this.getSingleLineFilter(),
      this.getSingleLineKeymap(),
      
      // Single-line themez
      this.getSingleLineEditorTheme(),
      
      // Get base extensions
      ...this.getBaseExtensions(),
    ]

    return extensions
  }

  /**
   * Process initial content to remove newlines
   */
  protected processInitialContent(content: string): string {
    return content.replace(/\n/g, ' ')
  }

  /**
   * Process content updates to remove newlines
   */
  protected processContentUpdate(content: string): string {
    return content.replace(/\n/g, ' ')
  }

  /**
   * Position cursor at end after content update
   */
  protected getSelectionAfterContentUpdate(content: string): { anchor: number; head: number } {
    return { anchor: content.length, head: content.length }
  }

  /**
   * Focus at end by default for single-line editors
   */
  focus(): void {
    if (this.view) {
      this.view.focus()
      const length = this.view.state.doc.length
      this.view.dispatch({
        selection: { anchor: length, head: length }
      })
    }
  }

  /**
   * Single-line transaction filter - prevents line breaks
   */
  private getSingleLineFilter(): Extension {
    return EditorState.transactionFilter.of((tr: Transaction) => {
      if (tr.docChanged) {
        let hasNewlines = false
        let newChanges: any[] = []
        
        tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
          if (inserted.toString().includes('\n')) {
            hasNewlines = true
            // Replace newlines with spaces in the inserted text
            const cleanInserted = inserted.toString().replace(/\n/g, ' ')
            newChanges.push({
              from: fromA,
              to: toA,
              insert: cleanInserted
            })
          } else {
            newChanges.push({
              from: fromA,
              to: toA,
              insert: inserted.toString()
            })
          }
        })
        
        if (hasNewlines) {
          // Create a new transaction with cleaned changes
          return [{
            ...tr,
            changes: tr.state.changes(newChanges)
          }]
        }
      }
      return tr
    })
  }

  /**
   * Custom keymap to prevent Enter key from creating new lines
   */
  private getSingleLineKeymap(): Extension {
    return keymap.of([
      {
        key: 'Enter',
        preventDefault: true,
        run: () => true // Do nothing on Enter
      },
      {
        key: 'Shift-Enter',
        preventDefault: true,
        run: () => true // Do nothing on Shift-Enter
      },
      {
        key: 'Ctrl-Enter',
        preventDefault: true,
        run: () => true // Do nothing on Ctrl-Enter
      },
      {
        key: 'Cmd-Enter',
        preventDefault: true,
        run: () => true // Do nothing on Cmd-Enter
      }
    ])
  }

  /**
   * Single-line editor theme
   */
  private getSingleLineEditorTheme(): Extension {
    return EditorView.theme({
      // Remove all focus borders and outlines
      '.cm-editor': {
        outline: 'none !important',
        border: 'none !important',
        width: '100% !important',
        maxWidth: '100% !important',
        maxHeight: '1.5rem !important', // Enforce single line height
        overflow: 'hidden !important', // Hide any overflow
      },
      '.cm-editor.cm-focused': {
        outline: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
      },
      '.cm-content': {
        outline: 'none !important',
        border: 'none !important',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '0.875rem',
        padding: '4px 0',
        minHeight: 'auto',
        maxHeight: '1.5rem !important', // Enforce single line height
        overflow: 'hidden !important', // Hide any overflow
        whiteSpace: 'nowrap !important', // Prevent wrapping
      },
      '.cm-content:focus': {
        outline: 'none !important',
        border: 'none !important',
        boxShadow: 'none !important',
      },
      '.cm-focused': {
        outline: 'none !important',
      },
      '.cm-line': {
        padding: '0',
        lineHeight: '1.5',
        maxHeight: '1.5rem !important', // Enforce single line height
        overflow: 'hidden !important', // Hide any overflow
        whiteSpace: 'nowrap !important', // Prevent wrapping
      },
      // Ensure single line by hiding overflow and preventing scrolling
      '.cm-scroller': {
        fontFamily: 'inherit',
        outline: 'none !important',
        border: 'none !important',
        overflow: 'hidden !important', // Hide all overflow
        maxHeight: '1.5rem !important', // Enforce single line height
        scrollbarWidth: 'none !important',
        msOverflowStyle: 'none !important',
      },
      '.cm-scroller::-webkit-scrollbar': {
        display: 'none !important',
      },
      '.cm-focused .cm-scroller': {
        outline: 'none !important',
        border: 'none !important',
      },
      // Hide scrollbars completely
      '.cm-scrollbar': {
        display: 'none !important',
      },
      // Ensure no vertical scrolling
      '.cm-editor .cm-scroller': {
        overflowY: 'hidden !important',
        overflowX: 'auto !important', // Allow horizontal scrolling for long text
      },
      // Include base cursor theme
      ...EditorThemeUtils.getCursorTheme(),
    }, { dark: true })
  }
}

/**
 * Creates a single-line CodeMirror editor with common configurations
 */
function createSingleLineEditor(
  container: HTMLElement,
  options: BaseEditorOptions = {}
): BaseEditorInstance {
  const editor = new SingleLineEditor(container, options)
  
  return {
    view: editor.getView()!,
    setContent: (content: string) => editor.setContent(content),
    getContent: () => editor.getContent(),
    focus: () => editor.focus(),
    destroy: () => editor.destroy()
  }
}

/**
 * Hook for using single-line CodeMirror editor in React components
 */
export function useSingleLineEditor(
  containerRef: React.RefObject<HTMLElement>,
  options: BaseEditorOptions & {
    /** Dependencies array for when to recreate the editor */
    deps?: React.DependencyList
    /** Whether to auto-focus the editor when created */
    autoFocus?: boolean
  } = {}
) {
  const { deps = [], autoFocus = false, ...editorOptions } = options
  const editorInstanceRef = React.useRef<BaseEditorInstance | null>(null)

  // Create/destroy editor effect
  useEffect(() => {
    if (containerRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = createSingleLineEditor(containerRef.current, editorOptions)
    }

    if (autoFocus) {
      setTimeout(() => {
        editorInstanceRef.current?.focus()
      }, 100)
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy()
        editorInstanceRef.current = null
      }
    }
  }, deps)

  // Handle value prop changes from parent
  useEffect(() => {
    if (options.doc !== undefined && editorInstanceRef.current) {
      const currentEditorValue = editorInstanceRef.current.getContent()
      // Only update if the value is truly different from what's in the editor
      if (options.doc !== currentEditorValue) {
        editorInstanceRef.current.setContent(options.doc)
      }
    }
  }, [options.doc])

  return editorInstanceRef.current
}
