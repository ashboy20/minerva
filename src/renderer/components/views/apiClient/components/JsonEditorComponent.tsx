import { useRef, useEffect } from 'react';
import { JsonEditorInstance, useJsonEditor } from '@/renderer/lib/codemirror/editors/JsonEditor';
import { Button } from '@/components/ui/button';

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

  // All lifecycle management and value synchronization handled automatically!
  const editor = useJsonEditor(containerRef, {
    doc: value,
    placeholder,
    editable: !disabled,
    darkTheme,
    onChange: (newValue) => {
      onChange?.(newValue);
    },
    deps: [disabled, darkTheme] // Recreate when these change
  });

  // Call onReady when editor becomes available
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  const handlePrettify = () => {
    if (editor) {
      editor.formatJson();
    }
  };

  return (
    <div>
        <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Enter request body (JSON, XML, etc.)</p>
            <Button size="sm" className="px-2" onClick={handlePrettify}>
                Prettify
            </Button>
        </div>
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
            if (editor) {
            editor.focus();
            }
        }}
        />
    </div>

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
