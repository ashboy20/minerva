import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TrashIcon } from '@radix-ui/react-icons';

interface InputRowProps {
	id: number;
	keyValue: string;
	value: string;
	enabled: boolean;
	disabled?: boolean;
	isPathParamTable?: boolean;
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
}: InputRowProps) {
	const handleEnable = (checked: boolean) => {
		if (!disabled) {
			onChange(id, 'enabled', checked);
		}
	};

	const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!disabled) {
			onChange(id, 'keyValue', e.target.value);
		}
	};

	const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!disabled) {
			onChange(id, 'value', e.target.value);
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
			<Input 
				placeholder="Key" 
				value={keyValue} 
				onChange={handleKeyChange} 
				disabled={disabled}
				className={disabled ? 'cursor-not-allowed' : ''}
			/>
			<Input 
				placeholder="Value" 
				value={value} 
				onChange={handleValueChange} 
				disabled={disabled}
				className={disabled ? 'cursor-not-allowed' : ''}
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