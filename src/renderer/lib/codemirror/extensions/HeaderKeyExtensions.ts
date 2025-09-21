import { EditorView } from "@codemirror/view";

// Common HTTP headers for autocompletion
const commonHeaders = [
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
        apply: (view: EditorView, completion: any, from: number, to: number) => {
          view.dispatch({
            changes: { from: from, to: to, insert: completion.label },
            selection: { anchor: from + completion.label.length, head: from + completion.label.length }
          })
        }
      })),
    };
  }
  