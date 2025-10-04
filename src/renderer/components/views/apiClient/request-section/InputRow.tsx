import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TrashIcon } from '@radix-ui/react-icons';
import { useSingleLineEditor } from '@/renderer/lib/codemirror/editors/SingleLineEditor';
import { variableExtensions } from '@/renderer/lib/codemirror/extensions/VariableExtensions';
import { autocompletion } from '@codemirror/autocomplete';
import { headerKeyCompletions } from '@/renderer/lib/codemirror/extensions/HeaderKeyExtensions';

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
}: InputRowProps) {
	const parseExtensions = () => {
		if (isHeaderTable) {
			return [
				autocompletion({
					override: [headerKeyCompletions],
				}),
			];
		}
		return [...variableExtensions];
	};

	const keyEditorRef = useRef<HTMLDivElement>(null);
	const valueEditorRef = useRef<HTMLDivElement>(null);

	// Local state to track editor values
	const [localKeyValue, setLocalKeyValue] =
		useState(keyValue);
	const [localValue, setLocalValue] = useState(value);

	// Update local state when props change
	useEffect(() => {
		setLocalKeyValue(keyValue);
	}, [keyValue]);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	const keyEditorOptions = {
		doc: localKeyValue,
		placeholder: 'Key',
		editable: !disabled,
		extensions: parseExtensions(),
		onChange: (newValue: string) => {
			setLocalKeyValue(newValue);
			onChange(id, 'keyValue', newValue);
		},
	};

	const valueEditorOptions = {
		doc: localValue,
		placeholder: 'Value',
		editable: !disabled,
		extensions: [...variableExtensions],
		onChange: (newValue: string) => {
			setLocalValue(newValue);
			onChange(id, 'value', newValue);
		},
	};

	useSingleLineEditor(keyEditorRef, keyEditorOptions);
	useSingleLineEditor(valueEditorRef, valueEditorOptions);

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
		<div
			className={`group flex flex-row items-center gap-2 ${disabled ? 'opacity-60' : ''}`}
		>
			{isPathParamTable ? (
				<div className="h-5 w-9" />
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
