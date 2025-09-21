import React, { useRef, useEffect } from 'react'
import { useSingleLineEditor } from '@/renderer/lib/codemirror/editors/SingleLineEditor'
import { variableExtensions } from '@/renderer/lib/codemirror/extensions/VariableExtensions'
import { urlParamExtensions } from '@/renderer/lib/codemirror/extensions/UrlParamExtensions'

interface UrlInputFieldProps {
  value?: string
  onChange: (value: string) => void
}

export const UrlInputField = ({ value, onChange }: UrlInputFieldProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastValueRef = useRef(value)

  const editorOptions = {
    doc: value ?? '',
    placeholder: 'input the url here',
    extensions: [
      ...variableExtensions,
      ...urlParamExtensions,
    ],
    onChange: (newValue: string) => {
      // Only call onChange if this is actually a user change
      if (newValue !== lastValueRef.current) {
        lastValueRef.current = newValue
        onChange(newValue)
      }
    }
  }

  // Update lastValueRef when prop changes
  useEffect(() => {
    lastValueRef.current = value
  }, [value])
  
  useSingleLineEditor(containerRef, editorOptions)

  return (
    <div className="h-9 w-full max-w-full overflow-hidden rounded-md border border-input pt-1 pl-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring" ref={containerRef}></div>
  )
}
