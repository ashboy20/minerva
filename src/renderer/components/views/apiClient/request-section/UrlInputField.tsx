import React, { useCallback, useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { DecorationSet, EditorView, ViewPlugin, ViewUpdate, Decoration, keymap, hoverTooltip } from '@codemirror/view'
import { defaultKeymap, historyKeymap } from '@codemirror/commands'
import { autocompletion } from '@codemirror/autocomplete'

// Theme using Tailwind CSS variables for consistency
const urlHighlightTheme = EditorView.theme({
  '.cm-variable': {
    padding: '2px 8px',
    fontWeight: '500',
    lineHeight: '1',
    transition: 'colors 0.2s',
  },
  '.cm-variable-valid': {
    color: 'hsl(120, 60%, 50%)',
  },
  '.cm-variable-invalid': {
    color: 'hsl(0, 60%, 50%)',
  },
  '.cm-path-param': {
    color: 'hsl(15, 70%, 45%)', // Brown-red color
    padding: '2px 6px',
    fontWeight: '600',
    lineHeight: '1',
    transition: 'colors 0.2s',
  },
  '.cm-cursor': {
    borderLeft: '2px solid hsl(var(--foreground)) !important',
    animation: 'blink 1s step-end infinite !important',
  },
  // Remove all focus borders and outlines
  '.cm-editor': {
    outline: 'none !important',
    border: 'none !important',
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
  },
  '.cm-content:focus': {
    outline: 'none !important',
    border: 'none !important',
    boxShadow: 'none !important',
  },
  '.cm-scroller': {
    outline: 'none !important',
    border: 'none !important',
  },
  '.cm-focused .cm-scroller': {
    outline: 'none !important',
    border: 'none !important',
  },
  '@keyframes blink': {
    '0%, 50%': { opacity: '1' },
    '51%, 100%': { opacity: '0' },
  }
}, { dark: true })

// TODO: move this to utils or BE?
const variables: Record<string, string> = {
  'HOST': 'https://api.example.com',
  'API_KEY': 'api-key',
}

// TODO: move the utils?
function myCompletions(context: any) {
  let word = context.matchBefore(/\{\{/);
  if (!word) return null;
  if (word.from == word.to && !context.explicit) return null;
  return {
    from: word.to,
    options: [
      ...Object.keys(variables).map((key) => ({
        label: `${key}`,
        type: 'variable',
        apply: (view: EditorView, completion: any, from: number, to: number) => {
          const insert = `${completion.label}}}`
          view.dispatch({
            changes: { from: from, to: to, insert: insert },
            selection: { anchor: from + insert.length, head: from + insert.length }
          })
        }
      })),
    ]
  };
}

// TODO: move to utils or somewhere else?
// Hover tooltip function to show variable values
const variableHover = hoverTooltip((view, pos, side) => {
  const doc = view.state.doc
  const line = doc.lineAt(pos)
  const text = line.text

  // Find if cursor is over a variable {{...}}
  const variableRegex = /\{\{([^}]+)\}\}/g
  let match
  
  while ((match = variableRegex.exec(text)) !== null) {
    const start = line.from + match.index
    const end = line.from + match.index + match[0].length
    
    // Check if cursor position is within this variable
    if (pos >= start && pos <= end) {
      const variableName = match[1]
      const variableValue = variables[variableName]
      
      if (variableValue) {
        return {
          pos: start,
          end: end,
          below: true,
          create(view) {
            const dom = document.createElement("div")
            dom.className = "cm-tooltip-variable"
            dom.innerHTML = `
              <div style="padding: 8px; background: hsl(var(--popover)); border: 1px solid hsl(var(--border)); border-radius: 6px; font-size: 0.875rem;">
                <div style="font-weight: 600; color: hsl(var(--foreground));">Key: ${variableName}</div>
                <div style="color: hsl(var(--muted-foreground)); margin-top: 4px;">Value: ${variableValue}</div>
              </div>
            `
            return { dom }
          }
        }
      }
    }
  }
  
  return null
})

// highlight the url and variables
const urlInputDecorator = ViewPlugin.fromClass(class {
  decorations: DecorationSet
  

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView) {
    const decorations = []
    const text = view.state.doc.toString()
    
    // Highlight {{variables}}
    const variableRegex = /\{\{[^}]+\}\}/g
    let match
    
    while ((match = variableRegex.exec(text)) !== null) {
      const variableName = match[0].slice(2, -2) // Remove {{ and }}
      const isValid = variables[variableName] !== undefined
      
      decorations.push(
        Decoration.mark({ 
          class: isValid ? 'cm-variable cm-variable-valid' : 'cm-variable cm-variable-invalid' 
        }).range(
          match.index, 
          match.index + match[0].length
        )
      )
    }

    // Highlight path parameters like :id, :userId, etc.
    const pathParamRegex = /:[a-zA-Z_][a-zA-Z0-9_]*/g
    pathParamRegex.lastIndex = 0 // Reset regex
    
    while ((match = pathParamRegex.exec(text)) !== null) {
      decorations.push(
        Decoration.mark({ class: 'cm-path-param' }).range(
          match.index,
          match.index + match[0].length
        )
      )
    }

    return Decoration.set(decorations)
  }
}, {
  decorations: v => v.decorations
})

interface UrlInputFieldProps {
  value?: string
  placeholder?: string
  onChange: (value: string) => void
}
0
export const UrlInputField = ({ value, placeholder, onChange }: UrlInputFieldProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const [contentValue, setContentValue] = useState(value || '')
  const isInternalChange = useRef(false) // Prevent infinite loops

  useEffect(() => {
      if (containerRef.current) {
        const state = EditorState.create({
          doc: value ?? placeholder ?? 'https://api.example.com/endpoint',
          extensions: [
            EditorState.allowMultipleSelections.of(true),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            urlHighlightTheme,
            urlInputDecorator,
            autocompletion({
              override: [myCompletions],
            }),
            variableHover,
            // Add update listener to trigger onChange
            EditorView.updateListener.of((update) => {
              if (update.docChanged && !isInternalChange.current) {
                const newValue = update.state.doc.toString()
                setContentValue(newValue)
                onChange(newValue)
              }
            })
          ],
        })
        const view = new EditorView({
          state,
          parent: containerRef.current,
        })

        editorViewRef.current = view

        // Focus and set cursor at end for testing
        setTimeout(() => {
          view.focus()
          const length = view.state.doc.length
          view.dispatch({
            selection: { anchor: length, head: length }
          })
        }, 100)

        return () => {
          if (editorViewRef.current) {
            editorViewRef.current.destroy()
            editorViewRef.current = null
          }
        }
      }
    }, [])

  // Method to set content programmatically
  const setContent = useCallback((newContent: string) => {
    if (editorViewRef.current) {
      isInternalChange.current = true
      const currentDoc = editorViewRef.current.state.doc
      editorViewRef.current.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: newContent },
        selection: { anchor: newContent.length, head: newContent.length }
      })
      isInternalChange.current = false
    }
  }, [])

  // Handle value prop changes from parent (only when significantly different)
  useEffect(() => {
    if (value !== undefined && value !== contentValue && editorViewRef.current) {
      const currentEditorValue = editorViewRef.current.state.doc.toString()
      // Only update if the value is truly different from what's in the editor
      if (value !== currentEditorValue) {
        setContentValue(value)
        setContent(value)
      }
    }
  }, [value, setContent])

    return (
      <div className="h-9 w-full rounded-md border border-input pt-1 pl-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring" ref={containerRef}></div>
    )
}
