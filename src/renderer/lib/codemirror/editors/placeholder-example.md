# CodeMirror Placeholder Example

The BaseEditor now properly supports CodeMirror's built-in placeholder functionality!

## How it works:

```typescript
// BaseEditor automatically adds placeholder extension when placeholder option is provided
const editor = createJsonEditor(container, {
  placeholder: "Enter JSON here...",  // ✅ This will show as grayed-out text when empty
  doc: "",                           // ✅ Starts empty, placeholder visible
  onChange: (value) => console.log(value)
})

// Single-line editor with placeholder
const singleLineEditor = useSingleLineEditor(containerRef, {
  placeholder: "Enter URL here...",   // ✅ Shows when field is empty
  extensions: [/* your extensions */]
})
```

## Placeholder behavior:

- ✅ **Shows when empty**: Placeholder text appears in grayed-out style when editor is empty
- ✅ **Hides when typing**: Disappears as soon as user starts typing
- ✅ **Returns when cleared**: Reappears if user deletes all content
- ✅ **Not actual content**: Placeholder is not part of the document content
- ✅ **Proper styling**: Uses CodeMirror's built-in placeholder styling

## Before vs After:

### Before (Incorrect):
```typescript
// ❌ Placeholder was being used as initial content
const content = this.options.doc || this.options.placeholder || ''
```

### After (Correct):
```typescript
// ✅ Placeholder is handled by CodeMirror extension
const content = this.options.doc || ''

// ✅ Placeholder extension added separately
if (this.options.placeholder) {
  extensions.push(placeholder(this.options.placeholder))
}
```

This follows CodeMirror best practices and provides the expected UX behavior!
