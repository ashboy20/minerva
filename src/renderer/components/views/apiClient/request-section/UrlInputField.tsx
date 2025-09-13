import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DecorationSet, EditorView, ViewPlugin, ViewUpdate, Decoration, hoverTooltip } from '@codemirror/view'
import { Range } from '@codemirror/state'
import { createSingleLineEditor, SingleLineEditorInstance, variableHighlightTheme, singleLineEditorTheme } from '@/renderer/lib/codemirror/SingleLineEditor'


const urlPathParamsHighlightTheme = EditorView.theme({
  '.cm-path-param': {
    color: 'hsl(15, 70%, 45%)', // Brown-red color
    padding: '2px 6px',
    fontWeight: '600',
    lineHeight: '1',
    transition: 'colors 0.2s',
  },
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
    const text = view.state.doc.toString()
    
    // Highlight {{variables}}
    const variableRegex = /\{\{[^}]+\}\}/g
    let match
    const matches: Array<{from: number, to: number, class: string}> = []
    
    while ((match = variableRegex.exec(text)) !== null) {
      const variableName = match[0].slice(2, -2) // Remove {{ and }}
      const isValid = variables[variableName] !== undefined
      
      matches.push({
        from: match.index,
        to: match.index + match[0].length,
        class: isValid ? 'cm-variable cm-variable-valid' : 'cm-variable cm-variable-invalid'
      })
    }

    // Highlight path parameters like :id, :userId, etc.
    const pathParamRegex = /\/:[a-zA-Z_][a-zA-Z0-9_]*/g
    pathParamRegex.lastIndex = 0 // Reset regex
    
    while ((match = pathParamRegex.exec(text)) !== null) {
      matches.push({
        from: match.index,
        to: match.index + match[0].length,
        class: 'cm-path-param'
      })
    }

    let decorations: Range<Decoration>[] = []
    matches.map(match => decorations.push(Decoration.mark({ class: match.class }).range(match.from, match.to)))
    return Decoration.set(decorations, true)
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
  const editorInstanceRef = useRef<SingleLineEditorInstance | null>(null)
  const [contentValue, setContentValue] = useState(value || '')

  useEffect(() => {
    if (containerRef.current) {
      editorInstanceRef.current = createSingleLineEditor(containerRef.current, {
        doc: value ?? placeholder ?? 'https://api.example.com/endpoint',
        placeholder: placeholder ?? 'https://api.example.com/endpoint',
        editable: true,
        customExtensions: [singleLineEditorTheme, variableHighlightTheme, urlPathParamsHighlightTheme],
        decorator: urlInputDecorator,
        completions: [myCompletions],
        hover: variableHover,
        onChange: (newValue) => {
          setContentValue(newValue)
          onChange(newValue)
        }
      })

      // Focus and set cursor at end
      setTimeout(() => {
        editorInstanceRef.current?.focus()
      }, 100)

      return () => {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroy()
          editorInstanceRef.current = null
        }
      }
    }
  }, [])

  // Method to set content programmatically
  const setContent = useCallback((newContent: string) => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.setContent(newContent)
    }
  }, [])

  // Handle value prop changes from parent (only when significantly different)
  useEffect(() => {
    if (value !== undefined && value !== contentValue && editorInstanceRef.current) {
      const currentEditorValue = editorInstanceRef.current.getContent()
      // Only update if the value is truly different from what's in the editor
      if (value !== currentEditorValue) {
        setContentValue(value)
        setContent(value)
      }
    }
  }, [value, setContent])

    return (
      <div className="h-9 w-full max-w-full overflow-hidden rounded-md border border-input pt-1 pl-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring" ref={containerRef}></div>
    )
}
