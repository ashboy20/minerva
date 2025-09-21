import React, { useEffect } from 'react'
import { Extension } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { autocompletion, CompletionSource } from '@codemirror/autocomplete'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'
import { variableCompletions, variableHighlightTheme, variableHover, variableDecorations } from '@/renderer/lib/codemirror/extensions/VariableExtensions'
import { BaseEditor, BaseEditorOptions, BaseEditorInstance, EditorThemeUtils } from './BaseEditor'
import { createJsonCompletions } from '@/renderer/lib/codemirror/extensions/JsonEditorExtensions'
export interface JsonEditorOptions extends BaseEditorOptions {
  /** Whether to use dark theme */
  darkTheme?: boolean
}

export interface JsonEditorInstance extends BaseEditorInstance {
  /** Format JSON content */
  formatJson: () => void
}

/**
 * JSON editor implementation extending BaseEditor
 */
class JsonEditor extends BaseEditor {
  private jsonOptions: JsonEditorOptions

  constructor(container: HTMLElement, options: JsonEditorOptions = {}) {
    super(container, options)
    this.jsonOptions = {
      darkTheme: true,
      ...options
    }
    this.initialize()
  }

  protected buildExtensions(): Extension[] {
    const extensions = [
      // Core editor features
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      
      // Language support
      json(),
      linter(jsonParseLinter()),
      
      // Keymaps with JSON formatting
      keymap.of([
        indentWithTab,
        {
          key: 'Shift-Alt-f',
          preventDefault: true,
          run: () => {
            this.formatJson()
            return true
          }
        },
        {
          key: 'Mod-Shift-f', // Cmd+Shift+F on Mac, Ctrl+Shift+F on Windows/Linux
          preventDefault: true,
          run: () => {
            this.formatJson()
            return true
          }
        }
      ]),
      
      // JSON editor theme
      this.getJsonEditorTheme(),
      
      // Get base extensions
      ...this.getBaseExtensions(),
    ]

    // Add dark theme if requested
    if (this.jsonOptions.darkTheme) {
      extensions.push(oneDark)
    }

    // Add default JSON autocompletion (can be overridden via extensions)
    extensions.push(autocompletion({
      override: [variableCompletions, createJsonCompletions()],
      icons: false,
      maxRenderedOptions: 20
    }),
    variableHighlightTheme,
    variableDecorations,
    variableHover)

    return extensions
  }

  private getJsonEditorTheme(): Extension {
    return EditorView.theme({
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
      // Include base theme properties
      ...EditorThemeUtils.getBaseThemeProperties(),
      ...EditorThemeUtils.getCursorTheme(),
    })
  }

  /**
   * Format JSON content with proper indentation
   */
  formatJson(): void {
    if (this.view) {
      try {
        const content = this.view.state.doc.toString().trim()
        
        // If content is empty, don't try to format
        if (!content) return
        
        // Parse and format JSON with proper indentation
        const parsed = JSON.parse(content)
        const formatted = JSON.stringify(parsed, null, 2)
        
        this.setContent(formatted)
      } catch (error) {
        console.warn('Cannot format invalid JSON:', error)
        // Could show a toast notification here in the future
      }
    }
  }
}

/**
 * Creates a JSON editor with CodeMirror with line numbers, syntax highlighting, 
 * variable highlighting, autocompletion, and hover support
 */
function createJsonEditor(
  container: HTMLElement,
  options: JsonEditorOptions = {}
): JsonEditorInstance {
  const editor = new JsonEditor(container, options)
  
  return {
    view: editor.getView()!,
    setContent: (content: string) => editor.setContent(content),
    getContent: () => editor.getContent(),
    focus: () => editor.focus(),
    formatJson: () => editor.formatJson(),
    destroy: () => editor.destroy()
  }
}

/**
 * Hook for using JSON CodeMirror editor in React components
 */
export function useJsonEditor(
  containerRef: React.RefObject<HTMLElement>,
  options: JsonEditorOptions & {
    /** Dependencies array for when to recreate the editor */
    deps?: React.DependencyList
  } = {}
) {
  const { deps = [], ...editorOptions } = options
  const editorInstanceRef = React.useRef<JsonEditorInstance | null>(null)

  // Create/destroy editor effect
  React.useEffect(() => {
    if (containerRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = createJsonEditor(containerRef.current, editorOptions)
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy()
        editorInstanceRef.current = null
      }
    }
  }, deps)

  // Handle value prop changes from parent
  React.useEffect(() => {
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
