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
	onChange,
	onDelete,
}: InputRowProps) {
	const handleEnable = (checked: boolean) => {
		onChange(id, 'enabled', checked);
	};

	const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(id, 'keyValue', e.target.value);
	};

	const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(id, 'value', e.target.value);
	};

	const handleDelete = () => {
		onDelete(id);
	};

	return (
		<div className="flex items-center flex-row gap-2 group">
			<Checkbox checked={enabled} onCheckedChange={handleEnable} />
			<Input placeholder="Key" value={keyValue} onChange={handleKeyChange} />
			<Input placeholder="Value" value={value} onChange={handleValueChange} />
			<Button
				variant="ghost"
				size="sm"
				className="opacity-0 group-hover:opacity-50"
				onClick={handleDelete}
			>
				<TrashIcon />
			</Button>
		</div>
	);
}