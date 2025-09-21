import React, { useRef } from 'react';
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
				autocompletion({ override: [headerKeyCompletions] }),
			]
		}
		return [
			...variableExtensions
		]
	}

	const keyEditorRef = useRef<HTMLDivElement>(null);
	const valueEditorRef = useRef<HTMLDivElement>(null);
	const keyEditorOptions = {
		doc: keyValue,
		placeholder: 'Key',
		editable: !disabled,
		extensions: parseExtensions(),
	}

	const valueEditorOptions = {
		doc: value,
		placeholder: 'Value',
		editable: !disabled,
		extensions: [
			...variableExtensions,
		],
	}

	useSingleLineEditor(keyEditorRef, keyEditorOptions)
	useSingleLineEditor(valueEditorRef, valueEditorOptions)

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