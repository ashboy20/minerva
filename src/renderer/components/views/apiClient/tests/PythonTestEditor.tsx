import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { Label } from '@/renderer/components/ui/label';
import { Button } from '@/renderer/components/ui/button';
import { Info } from 'lucide-react';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/renderer/components/ui/collapsible';

interface PythonTestEditorProps {
	value: string;
	onChange: (value: string) => void;
}

const EXAMPLE_SCRIPT = `# Test script example
# Access response data:
# - response.status_code
# - response.json() 
# - response.headers
# - response.text

# Example assertions:
assert response.status_code == 200, "Status code should be 200"

data = response.json()
assert "id" in data, "Response should contain 'id' field"
assert data["id"] > 0, "ID should be positive"

# Set environment variables for next requests
# env.set("user_id", data["id"])

print("All tests passed!")`;

export function PythonTestEditor({
	value,
	onChange,
}: PythonTestEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const [showHelp, setShowHelp] = React.useState(false);

	useEffect(() => {
		if (!editorRef.current) return;

		const startState = EditorState.create({
			doc: value || '',
			extensions: [
				lineNumbers(),
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap]),
				python(),
				oneDark,
				syntaxHighlighting(defaultHighlightStyle),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						const newValue = update.state.doc.toString();
						onChange(newValue);
					}
				}),
				EditorView.theme({
					'&': {
						height: '400px',
						fontSize: '14px',
					},
					'.cm-scroller': {
						overflow: 'auto',
						fontFamily: 'Menlo, Monaco, "Courier New", monospace',
					},
				}),
			],
		});

		const view = new EditorView({
			state: startState,
			parent: editorRef.current,
		});

		viewRef.current = view;

		return () => {
			view.destroy();
		};
	}, []);

	// Update editor when value changes externally
	useEffect(() => {
		if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
			viewRef.current.dispatch({
				changes: {
					from: 0,
					to: viewRef.current.state.doc.length,
					insert: value || '',
				},
			});
		}
	}, [value]);

	const handleInsertExample = () => {
		if (viewRef.current) {
			const currentDoc = viewRef.current.state.doc.toString();
			const newValue = currentDoc ? `${currentDoc}\n\n${EXAMPLE_SCRIPT}` : EXAMPLE_SCRIPT;
			viewRef.current.dispatch({
				changes: {
					from: 0,
					to: viewRef.current.state.doc.length,
					insert: newValue,
				},
			});
			onChange(newValue);
		}
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label>Python Test Script</Label>
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						onClick={handleInsertExample}
					>
						Insert Example
					</Button>
				</div>
			</div>

			<Collapsible open={showHelp} onOpenChange={setShowHelp}>
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="mb-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
					>
						<Info className="h-4 w-4" />
						{showHelp ? 'Hide' : 'Show'} Available Objects & Functions
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="mb-2 space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
					<div>
						<h4 className="font-semibold">Response Object:</h4>
						<ul className="ml-4 mt-1 list-disc space-y-1 text-muted-foreground">
							<li>
								<code>response.status_code</code> - HTTP status code (int)
							</li>
							<li>
								<code>response.json()</code> - Parse response body as JSON
							</li>
							<li>
								<code>response.text</code> - Response body as text
							</li>
							<li>
								<code>response.headers</code> - Response headers (dict)
							</li>
						</ul>
					</div>
					<div>
						<h4 className="font-semibold">Environment Functions:</h4>
						<ul className="ml-4 mt-1 list-disc space-y-1 text-muted-foreground">
							<li>
								<code>env.get("key")</code> - Get environment variable
							</li>
							<li>
								<code>env.set("key", "value")</code> - Set environment
								variable for next requests
							</li>
						</ul>
					</div>
					<div>
						<h4 className="font-semibold">Built-in Functions:</h4>
						<ul className="ml-4 mt-1 list-disc space-y-1 text-muted-foreground">
							<li>
								<code>print(...)</code> - Print to console
							</li>
							<li>
								<code>assert condition, "message"</code> - Assert a condition
							</li>
						</ul>
					</div>
				</CollapsibleContent>
			</Collapsible>

			<div
				ref={editorRef}
				className="rounded-md border border-border overflow-hidden"
			/>

			<p className="text-xs text-muted-foreground">
				Write Python code to test the API response. Use assert statements to
				validate the response. The script will run after the API call completes.
			</p>
		</div>
	);
}

