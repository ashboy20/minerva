import { CompletionSource } from "@codemirror/autocomplete"

/**
 * JSON property autocompletion source
 */
export function createJsonCompletions(): CompletionSource {
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