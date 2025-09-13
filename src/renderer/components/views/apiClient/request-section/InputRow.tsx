import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TrashIcon } from '@radix-ui/react-icons';
import { createSingleLineEditor, SingleLineEditorInstance, variableHighlightTheme } from '@/renderer/lib/codemirror/SingleLineEditor';
import { headerKeyCompletions, variableCompletions, variableHover } from '@/renderer/lib/codemirror/VariableExtensions';

interface InputRowProps {
	id: number;
	keyValue: string;
	value: string;
	enabled: boolean;
	disabled?: boolean;
	isPathParamTable?: boolean;
	isHeaderTable?: boolean;
	onChange: (
		id: number,
		field: 'keyValue' | 'value' | 'enabled',
		value: string | boolean,
	) => void;
	onDelete: (id: number) => void;
	keyCompletions?: Array<any>;
	keyHovers?: Array<any>;
	valueCompletions?: Array<any>;
	valueHovers?: Array<any>;
}

export function InputRow({
	id,
	keyValue,
	value,
	enabled,
	disabled = false,
	onChange,
	onDelete,
	isPathParamTable = false,
	isHeaderTable = false,
	keyCompletions,
	keyHovers,
	valueCompletions,
	valueHovers,
}: InputRowProps) {
	const keyEditorRef = useRef<HTMLDivElement>(null);
	const valueEditorRef = useRef<HTMLDivElement>(null);
	const keyEditorInstanceRef = useRef<SingleLineEditorInstance | null>(null);
	const valueEditorInstanceRef = useRef<SingleLineEditorInstance | null>(null);

	// Initialize editors
	useEffect(() => {
		if (keyEditorRef.current && !keyEditorInstanceRef.current) {
			// Combine header completions with any provided completions for header tables
			const effectiveKeyCompletions = isHeaderTable 
				? [headerKeyCompletions, ...(keyCompletions || [])]
				: keyCompletions;

			keyEditorInstanceRef.current = createSingleLineEditor(keyEditorRef.current, {
				doc: keyValue,
				placeholder: 'Key',
				editable: !disabled,
				completions: effectiveKeyCompletions,
				hover: keyHovers,
				onChange: (newValue) => {
					if (!disabled) {
						onChange(id, 'keyValue', newValue);
					}
				}
			});
		}

		if (valueEditorRef.current && !valueEditorInstanceRef.current) {
			// Add variable completions and hover to all value fields (headers, query params, path params)
			const effectiveValueCompletions = [variableCompletions, ...(valueCompletions || [])];
			// Use variable hover as default, but allow override if provided
			const effectiveValueHover = valueHovers && valueHovers.length > 0 ? valueHovers[0] : variableHover;

			valueEditorInstanceRef.current = createSingleLineEditor(valueEditorRef.current, {
				doc: value,
				placeholder: 'Value',
				editable: !disabled,
				completions: effectiveValueCompletions,
				hover: effectiveValueHover,
				customExtensions: [variableHighlightTheme],
				onChange: (newValue) => {
					if (!disabled) {
						onChange(id, 'value', newValue);
					}
				}
			});
		}

		return () => {
			if (keyEditorInstanceRef.current) {
				keyEditorInstanceRef.current.destroy();
				keyEditorInstanceRef.current = null;
			}
			if (valueEditorInstanceRef.current) {
				valueEditorInstanceRef.current.destroy();
				valueEditorInstanceRef.current = null;
			}
		};
	}, []);

	// Update editor content when props change
	useEffect(() => {
		if (keyEditorInstanceRef.current && keyEditorInstanceRef.current.getContent() !== keyValue) {
			keyEditorInstanceRef.current.setContent(keyValue);
		}
	}, [keyValue]);

	useEffect(() => {
		if (valueEditorInstanceRef.current && valueEditorInstanceRef.current.getContent() !== value) {
			valueEditorInstanceRef.current.setContent(value);
		}
	}, [value]);

	const handleEnable = (checked: boolean) => {
		if (!disabled) {
			onChange(id, 'enabled', checked);
		}
	};

	const handleDelete = () => {
		if (!disabled) {
			onDelete(id);
		}
	};

	return (
		<div className={`flex items-center flex-row gap-2 group ${disabled ? 'opacity-60' : ''}`}>
			{isPathParamTable ? (
				<div className="w-9 h-5" />
			) : (
				<Checkbox 
					checked={enabled} 
					onCheckedChange={handleEnable} 
					disabled={disabled}
				/>
			)}
			<div 
				ref={keyEditorRef}
				className={`h-9 flex-1 rounded-md border border-input px-3 py-1 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring ${disabled ? 'cursor-not-allowed bg-muted' : ''}`}
			/>
			<div 
				ref={valueEditorRef}
				className={`h-9 flex-1 rounded-md border border-input px-3 py-1 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring ${disabled ? 'cursor-not-allowed bg-muted' : ''}`}
			/>
			<Button
				variant="ghost"
				size="sm"
				className={`opacity-0 group-hover:opacity-50 ${disabled ? 'cursor-not-allowed' : ''}`}
				onClick={handleDelete}
				disabled={disabled}
			>
				<TrashIcon />
			</Button>
		</div>
	);
}