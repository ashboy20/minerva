// React types for the hook, but we don't need React itself here
import { EditorState, Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, drawSelection, dropCursor, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history, indentWithTab } from '@codemirror/commands'
import { autocompletion, CompletionSource } from '@codemirror/autocomplete'
import { indentOnInput, bracketMatching } from '@codemirror/language'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'
import { variableCompletions, variableHover, variables, variableHighlighting } from '@/renderer/lib/codemirror/VariableExtensions'

export interface JsonEditorOptions {
  /** Initial document content */
  doc?: string
  /** Placeholder text when doc is empty */
  placeholder?: string
  /** Whether the editor is editable */
  editable?: boolean
  /** Whether to use dark theme */
  darkTheme?: boolean
  /** Custom autocompletion sources */
  completions?: CompletionSource[]
  /** Callback when content changes */
  onChange?: (value: string) => void
  /** Additional custom extensions */
  customExtensions?: Extension[]
}

export interface JsonEditorInstance {
  /** The CodeMirror EditorView instance */
  view: EditorView
  /** Set content programmatically */
  setContent: (content: string) => void
  /** Get current content */
  getContent: () => string
  /** Focus the editor */
  focus: () => void
  /** Format JSON content */
  formatJson: () => void
  /** Destroy the editor */
  destroy: () => void
}

// JSON property autocompletion source
function createJsonCompletions(): CompletionSource {
  return (context) => {
    const { state, pos } = context
    const doc = state.doc
    const line = doc.lineAt(pos)
    const lineText = line.text
    const linePos = pos - line.from
    
    // Check if we're inside a string
    const beforeCursor = lineText.slice(0, linePos)
    const inString = (beforeCursor.match(/"/g) || []).length % 2 === 1
    
    if (!inString) {
      return null
    }
    
    // JSON property suggestions
    const commonJsonProps = [
      'id', 'name', 'type', 'value', 'data', 'items', 'length', 'count',
      'status', 'message', 'error', 'success', 'result', 'response',
      'created_at', 'updated_at', 'deleted_at', 'timestamp'
    ]
    
    const word = context.matchBefore(/\w*/)
    if (!word || word.from === word.to) {
      return null
    }
    
    const completions = commonJsonProps
      .filter(prop => prop.toLowerCase().includes(word.text.toLowerCase()))
      .map(prop => ({
        label: prop,
        type: 'property'
      }))
    
    return {
      from: word.from,
      options: completions
    }
  }
}

/**
 * Creates a JSON editor with CodeMirror with line numbers, syntax highlighting, 
 * variable highlighting, autocompletion, and hover support
 */
export function createJsonEditor(
  container: HTMLElement,
  options: JsonEditorOptions = {}
): JsonEditorInstance {
  const {
    doc = '',
    placeholder = '',
    editable = true,
    darkTheme = true,
    completions = [],
    onChange,
    customExtensions = []
  } = options

  let isInternalChange = false
  let view: EditorView

  // Enhanced JSON formatting function
  const formatJson = () => {
    if (view) {
      try {
        const content = view.state.doc.toString().trim()
        
        // If content is empty, don't try to format
        if (!content) return
        
        // Parse and format JSON with proper indentation
        const parsed = JSON.parse(content)
        const formatted = JSON.stringify(parsed, null, 2)
        
        setContent(formatted)
      } catch (error) {
        console.warn('Cannot format invalid JSON:', error)
        // Could show a toast notification here in the future
      }
    }
  }

  // Base extensions for JSON editor
  const baseExtensions: Extension[] = [
    // Core editor features
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    history(),
    
    // Language support
    json(),
    linter(jsonParseLinter()),
    
    // Keymaps
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
      {
        key: 'Shift-Alt-f',
        preventDefault: true,
        run: () => {
          formatJson()
          return true
        }
      },
      {
        key: 'Mod-Shift-f', // Cmd+Shift+F on Mac, Ctrl+Shift+F on Windows/Linux
        preventDefault: true,
        run: () => {
          formatJson()
          return true
        }
      }
    ]),
    
    // Variable extensions from VariableExtensions.ts
    variableHover,
    ...variableHighlighting,
    
    // Editor settings
    EditorView.editable.of(editable),
    EditorView.theme({
      '.cm-editor': {
        fontSize: '14px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
        height: '100%',
        position: 'relative',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '200px',
        cursor: 'text',
        caretColor: 'hsl(var(--foreground))',
      },
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
      }
    })
  ]

  // Add theme
  if (darkTheme) {
    baseExtensions.push(oneDark)
  }

  // Add autocompletion - use existing variable completions and custom JSON completions
  const allCompletions = [variableCompletions, createJsonCompletions(), ...completions]
  baseExtensions.push(autocompletion({
    override: allCompletions,
    icons: false,
    maxRenderedOptions: 20
  }))

  // Add change listener
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

  const state = EditorState.create({
    doc: doc || placeholder || '',
    extensions: baseExtensions,
  })

  view = new EditorView({
    state,
    parent: container,
  })

  // Utility functions
  const setContent = (newContent: string) => {
    if (view) {
      isInternalChange = true
      const currentDoc = view.state.doc
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: newContent },
        selection: { anchor: 0, head: 0 }
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

  const destroy = () => {
    if (view) {
      view.destroy()
    }
  }

  return {
    view,
    setContent,
    getContent,
    focus,
    formatJson,
    destroy
  }
}

// React hook interface for TypeScript (actual implementation should be in React component)
export interface UseJsonEditorOptions extends JsonEditorOptions {
  /** Dependencies array for when to recreate the editor */
  deps?: any[]
}

// Export the hook type for use in React components
export type UseJsonEditorHook = (
  containerRef: { current: HTMLElement | null },
  options?: UseJsonEditorOptions
) => JsonEditorInstance | null
