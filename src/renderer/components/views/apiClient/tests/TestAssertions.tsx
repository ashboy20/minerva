import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/renderer/components/ui/select';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/renderer/components/ui/tabs';
import {
	TestAssertion,
	AssertionType,
	AssertionOperator,
} from '@/types/backend/tests';
import { PythonTestEditor } from './PythonTestEditor';
import { getUUID } from '@/utils/getUUID';

interface TestAssertionsProps {
	assertions: TestAssertion[];
	testScript?: string;
	onChange: (assertions: TestAssertion[]) => void;
	onTestScriptChange: (script: string) => void;
}

const assertionTypeLabels: Record<AssertionType, string> = {
	status_code: 'Status Code',
	response_time: 'Response Time',
	header: 'Response Header',
	json_body: 'JSON Body',
	text_body: 'Text Body',
};

const operatorLabels: Record<AssertionOperator, string> = {
	equals: 'Equals',
	not_equals: 'Not Equals',
	greater_than: 'Greater Than',
	less_than: 'Less Than',
	contains: 'Contains',
	not_contains: 'Not Contains',
	matches_regex: 'Matches Regex',
	exists: 'Exists',
	not_exists: 'Does Not Exist',
	in_range: 'In Range',
};

// Get operators available for each assertion type
const getOperatorsForType = (
	type: AssertionType,
): AssertionOperator[] => {
	switch (type) {
		case 'status_code':
			return [
				'equals',
				'not_equals',
				'greater_than',
				'less_than',
				'in_range',
			];
		case 'response_time':
			return ['less_than', 'greater_than', 'in_range'];
		case 'header':
			return [
				'exists',
				'not_exists',
				'equals',
				'not_equals',
				'contains',
				'matches_regex',
			];
		case 'json_body':
			return [
				'exists',
				'not_exists',
				'equals',
				'not_equals',
				'contains',
				'matches_regex',
			];
		case 'text_body':
			return [
				'contains',
				'not_contains',
				'matches_regex',
				'equals',
			];
		default:
			return ['equals'];
	}
};

// Check if a target field is needed for this assertion type
const needsTarget = (type: AssertionType): boolean => {
	return ['header', 'json_body'].includes(type);
};

// Check if an expected value is needed for this operator
const needsExpectedValue = (
	operator: AssertionOperator,
): boolean => {
	return !['exists', 'not_exists'].includes(operator);
};

// Check if a second expected value is needed (for range)
const needsExpectedValue2 = (
	operator: AssertionOperator,
): boolean => {
	return operator === 'in_range';
};

export function TestAssertions({
	assertions,
	testScript = '',
	onChange,
	onTestScriptChange,
}: TestAssertionsProps) {
	const [activeTab, setActiveTab] = useState('gui');

	const handleAddAssertion = () => {
		const newAssertion: TestAssertion = {
			id: getUUID(),
			type: 'status_code',
			operator: 'equals',
			expected_value: 200,
			enabled: true,
		};
		onChange([...assertions, newAssertion]);
	};

	const handleUpdateAssertion = (
		id: string,
		updates: Partial<TestAssertion>,
	) => {
		onChange(
			assertions.map((assertion) => {
				if (assertion.id === id) {
					const updated = { ...assertion, ...updates };

					// If type changed, reset operator to a valid one
					if (
						updates.type &&
						updates.type !== assertion.type
					) {
						const validOperators = getOperatorsForType(
							updates.type,
						);
						if (
							!validOperators.includes(assertion.operator)
						) {
							updated.operator = validOperators[0];
						}
						// Reset target and expected values when type changes
						updated.target = undefined;
						updated.expected_value = undefined;
						updated.expected_value_2 = undefined;
					}

					// If operator changed to exists/not_exists, clear expected value
					if (
						updates.operator &&
						!needsExpectedValue(updates.operator)
					) {
						updated.expected_value = undefined;
						updated.expected_value_2 = undefined;
					}

					return updated;
				}
				return assertion;
			}),
		);
	};

	const handleDeleteAssertion = (id: string) => {
		onChange(assertions.filter((a) => a.id !== id));
	};

	const renderGUIAssertions = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">
					GUI Assertions
				</h3>
				<Button
					size="sm"
					variant="outline"
					onClick={handleAddAssertion}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add Assertion
				</Button>
			</div>

			<div className="space-y-3">
				{assertions.length === 0 ? (
					<div className="rounded-md border border-dashed p-8 text-center">
						<p className="text-sm text-muted-foreground">
							No assertions added yet. Click "Add Assertion"
							to create one.
						</p>
					</div>
				) : (
					assertions.map((assertion) => (
						<div
							key={assertion.id}
							className="flex items-start gap-2 rounded-md border p-3"
						>
							<Checkbox
								checked={assertion.enabled}
								onCheckedChange={(checked) =>
									handleUpdateAssertion(assertion.id, {
										enabled: checked as boolean,
									})
								}
								className="mt-2"
							/>

							<div className="flex flex-1 flex-col gap-2">
								<div className="grid grid-cols-2 gap-2">
									{/* Assertion Type */}
									<div>
										<Label className="text-xs">Type</Label>
										<Select
											value={assertion.type}
											onValueChange={(value) =>
												handleUpdateAssertion(
													assertion.id,
													{
														type: value as AssertionType,
													},
												)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Object.entries(
													assertionTypeLabels,
												).map(([value, label]) => (
													<SelectItem
														key={value}
														value={value}
													>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Operator */}
									<div>
										<Label className="text-xs">
											Condition
										</Label>
										<Select
											value={assertion.operator}
											onValueChange={(value) =>
												handleUpdateAssertion(
													assertion.id,
													{
														operator:
															value as AssertionOperator,
													},
												)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{getOperatorsForType(
													assertion.type,
												).map((op) => (
													<SelectItem key={op} value={op}>
														{operatorLabels[op]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* Target (for headers and JSON paths) */}
								{needsTarget(assertion.type) && (
									<div>
										<Label className="text-xs">
											{assertion.type === 'header'
												? 'Header Name'
												: 'JSON Path (e.g., $.user.id)'}
										</Label>
										<Input
											placeholder={
												assertion.type === 'header'
													? 'Content-Type'
													: '$.user.id'
											}
											value={assertion.target || ''}
											onChange={(e) =>
												handleUpdateAssertion(
													assertion.id,
													{
														target: e.target.value,
													},
												)
											}
										/>
									</div>
								)}

								{/* Expected Value */}
								{needsExpectedValue(assertion.operator) && (
									<div className="grid grid-cols-2 gap-2">
										<div>
											<Label className="text-xs">
												{needsExpectedValue2(
													assertion.operator,
												)
													? 'Min Value'
													: 'Expected Value'}
											</Label>
											<Input
												placeholder="Value"
												type={
													[
														'status_code',
														'response_time',
													].includes(assertion.type)
														? 'number'
														: 'text'
												}
												value={
													assertion.expected_value ?? ''
												}
												onChange={(e) => {
													const value = [
														'status_code',
														'response_time',
													].includes(assertion.type)
														? Number(e.target.value)
														: e.target.value;
													handleUpdateAssertion(
														assertion.id,
														{
															expected_value: value,
														},
													);
												}}
											/>
										</div>

										{/* Second Expected Value (for range) */}
										{needsExpectedValue2(
											assertion.operator,
										) && (
											<div>
												<Label className="text-xs">
													Max Value
												</Label>
												<Input
													placeholder="Value"
													type="number"
													value={
														assertion.expected_value_2 ?? ''
													}
													onChange={(e) =>
														handleUpdateAssertion(
															assertion.id,
															{
																expected_value_2: Number(
																	e.target.value,
																),
															},
														)
													}
												/>
											</div>
										)}
									</div>
								)}
							</div>

							<Button
								size="sm"
								variant="ghost"
								onClick={() =>
									handleDeleteAssertion(assertion.id)
								}
								className="mt-1"
							>
								<Trash2 className="h-4 w-4 text-destructive" />
							</Button>
						</div>
					))
				)}
			</div>
		</div>
	);

	return (
		<div className="space-y-4">
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="gui">
						GUI Assertions
					</TabsTrigger>
					<TabsTrigger value="script">
						Python Script
					</TabsTrigger>
				</TabsList>

				<TabsContent value="gui" className="space-y-4">
					{renderGUIAssertions()}
				</TabsContent>

				<TabsContent value="script" className="space-y-4">
					<PythonTestEditor
						value={testScript}
						onChange={onTestScriptChange}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
