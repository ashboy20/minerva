/**
 * Test Assertion Types for API Testing
 */

export type AssertionType = 
	| 'status_code'
	| 'response_time'
	| 'header'
	| 'json_body'
	| 'text_body';

export type AssertionOperator = 
	| 'equals'
	| 'not_equals'
	| 'greater_than'
	| 'less_than'
	| 'contains'
	| 'not_contains'
	| 'matches_regex'
	| 'exists'
	| 'not_exists'
	| 'in_range';

export interface TestAssertion {
	id: string;
	type: AssertionType;
	operator: AssertionOperator;
	target?: string; // For headers or JSON paths
	expected_value?: string | number | boolean;
	expected_value_2?: string | number; // For range assertions
	enabled: boolean;
}

export interface TestScript {
	language: 'python';
	code: string;
	enabled: boolean;
}

export interface TestConfiguration {
	assertions: TestAssertion[];
	pre_request_script?: TestScript;
	post_request_script?: TestScript;
}

export interface AssertionResult {
	assertion_id: string;
	passed: boolean;
	message: string;
	expected?: any;
	actual?: any;
}

export interface ScriptResult {
	passed: boolean;
	message?: string;
	console_output?: string;
	error?: string;
}

export interface TestExecutionResult {
	passed: boolean;
	total_assertions: number;
	passed_assertions: number;
	failed_assertions: number;
	assertion_results: AssertionResult[];
	script_result?: ScriptResult;
	execution_time_ms: number;
}

