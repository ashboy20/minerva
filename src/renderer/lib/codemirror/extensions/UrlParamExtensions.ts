import { Decoration } from "@codemirror/view"

import { DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view"

const urlPathParamsHighlightTheme = EditorView.theme({
    '.cm-path-param': {
      color: 'hsl(15, 70%, 45%)', // Brown-red color
      padding: '2px 6px',
      fontWeight: '600',
      lineHeight: '1',
      transition: 'colors 0.2s',
    },
  })
  
  // highlight path parameters like :id, :userId, etc.
  const urlPathParamsDecorator = ViewPlugin.fromClass(class {
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
      const matches: Array<{from: number, to: number, class: string}> = []
  
      // Highlight path parameters like :id, :userId, etc.
      const pathParamRegex = /\/:[a-zA-Z_][a-zA-Z0-9_]*/g
      let match
      
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

export const urlParamExtensions = [
    urlPathParamsHighlightTheme,
    urlPathParamsDecorator
]