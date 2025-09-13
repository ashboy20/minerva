import { EditorView, hoverTooltip } from '@codemirror/view'

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
