import { EditorView, hoverTooltip } from '@codemirror/view'

export const variables: Record<string, string> = {
  'HOST': 'https://api.example.com',
  'API_KEY': 'api-key',
}

// Common HTTP headers for autocompletion
export const commonHeaders = [
  'Accept',
  'Accept-Charset',
  'Accept-Encoding',
  'Accept-Language',
  'Authorization',
  'Cache-Control',
  'Content-Length',
  'Content-Type',
  'Cookie',
  'Date',
  'Expect',
  'From',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Max-Forwards',
  'Pragma',
  'Proxy-Authorization',
  'Range',
  'Referer',
  'TE',
  'User-Agent',
  'Upgrade',
  'Via',
  'Warning',
  // Response headers that might be useful
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Credentials',
  'Access-Control-Expose-Headers',
  'Access-Control-Max-Age',
  'Content-Disposition',
  'Content-Security-Policy',
  'ETag',
  'Expires',
  'Last-Modified',
  'Location',
  'Server',
  'Set-Cookie',
  'Strict-Transport-Security',
  'Transfer-Encoding',
  'Vary',
  'WWW-Authenticate',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  // Custom/API headers
  'X-API-Key',
  'X-Auth-Token',
  'X-Request-ID',
  'X-Correlation-ID',
  'X-Rate-Limit-Limit',
  'X-Rate-Limit-Remaining',
  'X-Rate-Limit-Reset',
]

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
 * Header key completions for HTTP headers
 * Triggers when typing in header key fields
 */
export function headerKeyCompletions(context: any) {
  const word = context.matchBefore(/\w*/);
  if (!word) return null;
  if (word.from == word.to && !context.explicit) return null;
  
  const input = word.text.toLowerCase();
  
  // Filter headers based on current input
  const filteredHeaders = commonHeaders.filter(header => 
    header.toLowerCase().includes(input)
  );
  
  if (filteredHeaders.length === 0) return null;
  
  return {
    from: word.from,
    options: filteredHeaders.map((header) => ({
      label: header,
      type: 'keyword',
      detail: 'HTTP Header',
      apply: (view: EditorView, completion: any, from: number, to: number) => {
        view.dispatch({
          changes: { from: from, to: to, insert: completion.label },
          selection: { anchor: from + completion.label.length, head: from + completion.label.length }
        })
      }
    })),
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
