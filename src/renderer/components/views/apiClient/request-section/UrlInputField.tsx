import React, { useRef, useEffect } from 'react';
import { useSingleLineEditor } from '@/renderer/lib/codemirror/editors/SingleLineEditor';
import { variableExtensions } from '@/renderer/lib/codemirror/extensions/VariableExtensions';
import { urlParamExtensions } from '@/renderer/lib/codemirror/extensions/UrlParamExtensions';
import { useAppDispatch } from '@/store/hooks';
import { updateFromUrl } from '@/store/slices/urlSlice';
import { updateNotSaveState } from '@/store/slices/tabsSlice';

interface UrlInputFieldProps {
	value?: string;
	onChange: (value: string) => void;
}

export function UrlInputField({
	value,
	onChange,
}: UrlInputFieldProps) {
	const dispatch = useAppDispatch();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const lastValueRef = useRef(value);

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
				lastValueRef.current = newValue;
				onChange(newValue);

				// Update URL in urlSlice
				dispatch(updateFromUrl(newValue));
			}
		},
	};

	// Update lastValueRef when prop changes
	useEffect(() => {
		lastValueRef.current = value;
	}, [value]);

	// Don't pass value as a dependency - let the editor handle updates internally
	useSingleLineEditor(containerRef, {
		...editorOptions,
		deps: [], // Remove value from deps array
	});

	return (
		<div
			className="h-9 w-full max-w-full overflow-hidden rounded-md border border-input pl-2 pt-1 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
			ref={containerRef}
		/>
	);
}
