import React, { useState } from 'react';
import { InputRow } from '@/renderer/components/views/apiClient/components/InputRow';

interface TableFormProps {
	rows: {
		id: number;
		keyValue: string;
		value: string;
		enabled: boolean;
	}[];
}

export function TableForm({ rows }: TableFormProps) {
	const initRows = () => [
		...rows,
		{ id: rows.length + 1, keyValue: '', value: '', enabled: false },
	];


	const [tableRows, setTableRows] = useState(initRows());

	const onChange = (
		id: number,
		field: 'keyValue' | 'value' | 'enabled',
		value: string | boolean,
	) => {
		setTableRows((prevRows) => {
			const rowIndex = prevRows.findIndex((row) => row.id === id);
			const isLastRow = rowIndex === prevRows.length - 1;
			const shouldAddNewRow = isLastRow && field !== 'enabled' && value;

			// Update the current row
			const updatedRows = prevRows.map((row) => {
				if (row.id === id) {
					const updatedRow = { ...row, [field]: value };
					// Auto-enable if both key and value are filled
					if (field !== 'enabled' && updatedRow.keyValue && updatedRow.value) {
						updatedRow.enabled = true;
					}
					return updatedRow;
				}
				return row;
			});

			// Add new row if needed
			if (shouldAddNewRow) {
				const maxId = Math.max(...updatedRows.map((row) => row.id));
				return [
					...updatedRows,
					{
						id: maxId + 1,
						keyValue: '',
						value: '',
						enabled: false,
					},
				];
			}

			return updatedRows;
		});
	};

	const onDelete = (id: number) => {
		setTableRows((prevRows) => prevRows.filter((row) => row.id !== id));
	};

	return (
		<div className="flex flex-col gap-2">
			{tableRows.map((row) => (
				<InputRow
					key={row.id}
					id={row.id}
					keyValue={row.keyValue}
					value={row.value}
					enabled={row.enabled}
					onChange={onChange}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
