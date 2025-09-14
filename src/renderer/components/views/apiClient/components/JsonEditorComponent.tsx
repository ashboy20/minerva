import { useRef, useEffect, useState } from 'react';
import { JsonEditorInstance, createJsonEditor } from '@/renderer/lib/codemirror/JsonEditor';

interface JsonEditorComponentProps {
  /** Initial value for the editor */
  value?: string;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether the editor is editable */
  disabled?: boolean;
  /** Whether to use dark theme */
  darkTheme?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Callback when content changes */
  onChange?: (value: string) => void;
  /** Callback when editor is ready */
  onReady?: (editor: JsonEditorInstance) => void;
}

export function JsonEditorComponent({
  value = '',
  placeholder = '',
  disabled = false,
  darkTheme = true,
  className = '',
  onChange,
  onReady
}: JsonEditorComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JsonEditorInstance | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = createJsonEditor(containerRef.current, {
        doc: value,
        placeholder,
        editable: !disabled,
        darkTheme,
        onChange: (newValue) => {
          onChange?.(newValue);
        }
      });

      setIsReady(true);
      onReady?.(editorRef.current);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && isReady && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value);
    }
  }, [value, isReady]);

  // Update editability when disabled prop changes
  useEffect(() => {
    if (editorRef.current && isReady) {
      // Recreate editor with new editable state
      const currentContent = editorRef.current.getContent();
      editorRef.current.destroy();
      
      editorRef.current = createJsonEditor(containerRef.current!, {
        doc: currentContent,
        placeholder,
        editable: !disabled,
        darkTheme,
        onChange: (newValue) => {
          onChange?.(newValue);
        }
      });
    }
  }, [disabled, isReady]);

  return (
    <div 
      ref={containerRef} 
      className={`json-editor-container ${className}`}
      style={{ 
        minHeight: '200px',
        border: '1px solid hsl(var(--border))',
        borderRadius: '6px',
        overflow: 'visible', // Changed from 'hidden' to 'visible'
        position: 'relative' // Ensure proper positioning
      }}
      onClick={() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }}
    />
  );
}

// Export utility functions for external use
export const JsonEditorUtils = {
  /**
   * Validate JSON string
   */
  isValidJson: (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Format JSON string
   */
  formatJson: (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  },

  /**
   * Minify JSON string
   */
  minifyJson: (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed);
    } catch {
      return jsonString;
    }
  },

  /**
   * Extract variables from JSON string
   */
  extractVariables: (jsonString: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(jsonString)) !== null) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }
    
    return variables;
  }
};
