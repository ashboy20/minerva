import React, { useCallback, useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { DecorationSet, EditorView, ViewPlugin, ViewUpdate, Decoration, keymap } from '@codemirror/view'
import { defaultKeymap, historyKeymap } from '@codemirror/commands'

// Theme using Tailwind CSS variables for consistency
const urlHighlightTheme = EditorView.theme({
  '.cm-variable': {
    color: 'hsl(120, 60%, 50%)',
    padding: '2px 8px',
    fontWeight: '500',
    lineHeight: '1',
    transition: 'colors 0.2s',
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
      decorations.push(
        Decoration.mark({ class: 'cm-variable' }).range(
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
