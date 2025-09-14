import React from 'react'
import { EditorState, Transaction } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { autocompletion, CompletionSource } from '@codemirror/autocomplete'
import { drawSelection, dropCursor } from '@codemirror/view'
import { indentOnInput } from '@codemirror/language'
import { bracketMatching } from '@codemirror/language'
import { Extension } from '@codemirror/state'

export interface SingleLineEditorOptions {
  /** Initial document content */
  doc?: string
  /** Placeholder text when doc is empty */
  placeholder?: string
  /** Whether the editor is editable */
  editable?: boolean
  /** Custom theme extensions */
  theme?: Extension
  /** Custom decorator extensions */
  decorator?: Extension
  /** Autocompletion sources */
  completions?: CompletionSource[]
  /** Custom hover extensions */
  hover?: Extension
  /** Callback when content changes */
  onChange?: (value: string) => void
  /** Additional custom extensions */
  customExtensions?: Extension[]
}

export interface SingleLineEditorInstance {
  /** The CodeMirror EditorView instance */
  view: EditorView
  /** Set content programmatically */
  setContent: (content: string) => void
  /** Get current content */
  getContent: () => string
  /** Focus the editor */
  focus: () => void
  /** Destroy the editor */
  destroy: () => void
}

/**
 * Creates a single-line CodeMirror editor with common configurations
 */
export function createSingleLineEditor(
  container: HTMLElement,
  options: SingleLineEditorOptions = {}
): SingleLineEditorInstance {
  const {
    doc = '',
    placeholder = '',
    editable = true,
    theme,
    decorator,
    completions = [],
    hover,
    onChange,
    customExtensions = []
  } = options

  let isInternalChange = false

  // Single-line transaction filter - prevents line breaks
  const singleLineFilter = EditorState.transactionFilter.of((tr: Transaction) => {
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

  // Custom keymap to prevent Enter key from creating new lines
  const singleLineKeymap = keymap.of([
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

  // Base extensions for single-line editor
  const baseExtensions: Extension[] = [
    EditorState.allowMultipleSelections.of(true),
    singleLineFilter, // Add single-line filter first
    singleLineKeymap, // Add single-line keymap
    keymap.of([...defaultKeymap, ...historyKeymap]),
    history(), // Enables undo/redo and change tracking
    drawSelection(), // Shows text selection
    dropCursor(), // Shows cursor when dragging
    indentOnInput(), // Handles text input
    bracketMatching(), // Handles bracket matching
    EditorView.editable.of(editable),
    singleLineEditorTheme, // Apply default single-line theme
  ]

  // Add optional extensions
  if (theme) baseExtensions.push(theme)
  if (decorator) baseExtensions.push(decorator)
  if (hover) baseExtensions.push(hover)
  
  // Add autocompletion if completions are provided
  if (completions.length > 0) {
    baseExtensions.push(autocompletion({
      override: completions,
    }))
  }

  // Add change listener if onChange is provided
  if (onChange) {
    baseExtensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isInternalChange) {
          const newValue = update.state.doc.toString()
          onChange(newValue)
        }
      })
    )
  }

  // Add custom extensions
  baseExtensions.push(...customExtensions)

  // Clean initial content to remove any newlines
  const cleanContent = (doc || placeholder || '').replace(/\n/g, ' ')
  
  const state = EditorState.create({
    doc: cleanContent,
    extensions: baseExtensions,
  })

  const view = new EditorView({
    state,
    parent: container,
  })

  // Utility functions
  const setContent = (newContent: string) => {
    if (view) {
      isInternalChange = true
      const currentDoc = view.state.doc
      // Clean content to remove newlines
      const cleanContent = newContent.replace(/\n/g, ' ')
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: cleanContent },
        selection: { anchor: cleanContent.length, head: cleanContent.length }
      })
      isInternalChange = false
    }
  }

  const getContent = () => {
    return view ? view.state.doc.toString() : ''
  }

  const focus = () => {
    if (view) {
      view.focus()
    }
  }

  const focusAtEnd = () => {
    if (view) {
      view.focus()
      const length = view.state.doc.length
      view.dispatch({
        selection: { anchor: length, head: length }
      })
    }
  }

  const destroy = () => {
    if (view) {
      view.destroy()
    }
  }

  return {
    view,
    setContent,
    getContent,
    focus: focusAtEnd, // Focus at end by default for single-line editors
    destroy
  }
}

/**
 * Hook for using single-line CodeMirror editor in React components
 */
export function useSingleLineEditor(
  containerRef: React.RefObject<HTMLElement>,
  options: SingleLineEditorOptions & {
    /** Dependencies array for when to recreate the editor */
    deps?: React.DependencyList
  } = {}
) {
  const { deps = [], ...editorOptions } = options
  const editorInstanceRef = React.useRef<SingleLineEditorInstance | null>(null)

  React.useEffect(() => {
    if (containerRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = createSingleLineEditor(containerRef.current, editorOptions)
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy()
        editorInstanceRef.current = null
      }
    }
  }, deps)

  return editorInstanceRef.current
}

/**
 * Default single-line editor theme with common styling
 */
export const singleLineEditorTheme = EditorView.theme({
  '.cm-cursor': {
    borderLeft: '2px solid hsl(var(--foreground)) !important',
    animation: 'blink 1s step-end infinite !important',
  },
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
}, { dark: true })
