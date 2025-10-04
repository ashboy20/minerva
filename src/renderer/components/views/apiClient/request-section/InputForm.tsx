import React, { useState, useEffect } from 'react';
import { InputRow } from '@/renderer/components/views/apiClient/request-section/InputRow';

interface TableFormProps {
	rows: {
		row_id: number;
		keyValue: string;
		value: string;
		enabled: boolean;
		disabled?: boolean;
	}[];
	title?: string;
	onChange: (
		rows: {
			row_id: number;
			keyValue: string;
			value: string;
			enabled: boolean;
			disabled?: boolean;
		}[],
	) => void;
	isPathParamTable?: boolean;
	isHeaderTable?: boolean;
}

export function TableForm({
	rows,
	title,
	onChange,
	isPathParamTable = false,
	isHeaderTable = false,
}: TableFormProps) {
	const initRows = () => [
		...rows,
		...(!isPathParamTable
			? [
					{
						row_id: rows.length + 1,
						keyValue: '',
						value: '',
						enabled: true,
					},
				]
			: []),
	];

	const [tableRows, setTableRows] = useState(initRows());

	// ✅ Sync internal state when rows prop changes
	useEffect(() => {
		const newTableRows = [
			...rows,
			...(!isPathParamTable
				? [
						{
							row_id: rows.length + 1,
							keyValue: '',
							value: '',
							enabled: false,
						},
					]
				: []),
		];
		setTableRows(newTableRows);
	}, [rows]);

	const onRowChange = (
		row_id: number,
		field: 'keyValue' | 'value' | 'enabled',
		value: string | boolean,
	) => {
		setTableRows((prevRows) => {
			const rowIndex = prevRows.findIndex(
				(row) => row.row_id === row_id,
			);
			const isLastRow = rowIndex === prevRows.length - 1;
			const shouldAddNewRow =
				isLastRow && field !== 'enabled' && value;

			// Update the current row
			const updatedRows = prevRows.map((row) => {
				if (row.row_id === row_id) {
					const updatedRow = { ...row, [field]: value };
					// Auto-enable if both key and value are filled
					if (
						field !== 'enabled' &&
						updatedRow.keyValue &&
						updatedRow.value
					) {
						updatedRow.enabled = true;
					}
					return updatedRow;
				}
				return row;
			});

			// Add new row if needed
			if (shouldAddNewRow && !isPathParamTable) {
				const maxId = Math.max(
					...updatedRows.map((row) => row.row_id),
				);
				return [
					...updatedRows,
					{
						row_id: maxId + 1,
						keyValue: '',
						value: '',
						enabled: false,
					},
				];
			}

			// Notify parent of changes (exclude the empty last row)
			const validRows = updatedRows.filter(
				(row) => row.keyValue || row.value,
			);
			onChange(validRows);

			return updatedRows;
		});
	};

	const onRowDelete = (id: number) => {
		setTableRows((prevRows) => {
			const filtered = prevRows.filter(
				(row) => row.row_id !== id,
			);
			// Notify parent of changes (exclude the empty last row)
			const validRows = filtered.filter(
				(row) => row.keyValue || row.value,
			);
			onChange(validRows);
			return filtered;
		});
	};

	return (
		<div className="flex flex-col gap-2">
			{title && (
				<h3 className="text-sm font-medium">{title}</h3>
			)}
			{tableRows.map((row) => (
				<InputRow
					key={row.row_id}
					id={row.row_id}
					keyValue={row.keyValue}
					value={row.value}
					enabled={row.enabled}
					disabled={row.disabled}
					onChange={onRowChange}
					onDelete={onRowDelete}
					isPathParamTable={isPathParamTable}
					isHeaderTable={isHeaderTable}
				/>
			))}
		</div>
	);
}
