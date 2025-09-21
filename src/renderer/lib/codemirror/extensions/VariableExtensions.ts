import { EditorView, hoverTooltip, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view'
import { autocompletion } from '@codemirror/autocomplete';

// TODO: get them from BE
export const variables: Record<string, string> = {
  'HOST': 'https://api.example.com',
  'API_KEY': 'api-key',
}

/**
 * Variable completions for {{variable}} syntax
 */
export function variableCompletions(context: any) {
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

/**
 * Hover tooltip function to show variable values
 */
export const variableHover = hoverTooltip((view, pos, side) => {
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

            // TODO: translate this to a component
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

/**
 * Variable highlight theme for styling {{variable}} syntax
 */
export const variableHighlightTheme = EditorView.theme({
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
}, { dark: true })

/**
 * Variable widget for replacing {{variable}} text with styled elements
 */
class VariableWidget extends WidgetType {
  constructor(readonly variable: string, readonly isValid: boolean) {
    super()
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = `cm-variable ${this.isValid ? 'cm-variable-valid' : 'cm-variable-invalid'}`
    span.textContent = this.variable
    return span
  }
}

/**
 * Creates variable decorations for the current document
 */
function createVariableDecorations(view: EditorView): DecorationSet {
  const decorations: any[] = []
  const doc = view.state.doc
  const variableRegex = /\{\{([^}]+)\}\}/g
  
  for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum)
    const lineText = line.text
    let match
    
    while ((match = variableRegex.exec(lineText)) !== null) {
      const variableName = match[1].trim()
      const isValid = variables.hasOwnProperty(variableName)
      const from = line.from + match.index
      const to = from + match[0].length
      
      decorations.push(
        Decoration.replace({
          widget: new VariableWidget(match[0], isValid),
          inclusive: false
        }).range(from, to)
      )
    }
  }
  
  return Decoration.set(decorations)
}

/**
 * ViewPlugin that handles variable decorations
 */
export const variableDecorations = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = createVariableDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = createVariableDecorations(update.view)
    }
  }
}, {
  decorations: v => v.decorations
})

export const variableExtensions = [
  autocompletion({ override: [variableCompletions] }),
  variableHighlightTheme,
  variableDecorations,
  variableHover,
]