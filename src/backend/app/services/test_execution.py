import time
import re
import json
from typing import List, Any, Optional
from jsonpath_ng import parse as jsonpath_parse
from app.models.test_assertion import (
    TestAssertion,
    AssertionResult,
    ScriptResult,
    TestExecutionResult,
)


class TestExecutionService:
    """Service for executing test assertions and scripts"""

    def execute_tests(
        self,
        response_data: dict,
        assertions: List[TestAssertion],
        test_script: Optional[str] = None,
    ) -> TestExecutionResult:
        """Execute all tests against a response"""
        start_time = time.time()

        # Execute GUI assertions
        assertion_results = []
        passed_assertions = 0
        failed_assertions = 0

        for assertion in assertions:
            if not assertion.enabled:
                continue

            result = self._execute_assertion(assertion, response_data)
            assertion_results.append(result)

            if result.passed:
                passed_assertions += 1
            else:
                failed_assertions += 1

        # Execute Python script if provided
        script_result = None
        if test_script and test_script.strip():
            script_result = self._execute_script(test_script, response_data)
            if not script_result.passed:
                failed_assertions += 1

        # Calculate overall result
        total_assertions = passed_assertions + failed_assertions
        passed = failed_assertions == 0

        end_time = time.time()
        execution_time_ms = (end_time - start_time) * 1000

        return TestExecutionResult(
            passed=passed,
            total_assertions=total_assertions,
            passed_assertions=passed_assertions,
            failed_assertions=failed_assertions,
            assertion_results=assertion_results,
            script_result=script_result,
            execution_time_ms=execution_time_ms,
        )

    def _execute_assertion(
        self, assertion: TestAssertion, response_data: dict
    ) -> AssertionResult:
        """Execute a single assertion"""
        try:
            if assertion.type == "status_code":
                return self._check_status_code(assertion, response_data)
            elif assertion.type == "response_time":
                return self._check_response_time(assertion, response_data)
            elif assertion.type == "header":
                return self._check_header(assertion, response_data)
            elif assertion.type == "json_body":
                return self._check_json_body(assertion, response_data)
            elif assertion.type == "text_body":
                return self._check_text_body(assertion, response_data)
            else:
                return AssertionResult(
                    assertion_id=assertion.id,
                    passed=False,
                    message=f"Unknown assertion type: {assertion.type}",
                )
        except Exception as e:
            return AssertionResult(
                assertion_id=assertion.id,
                passed=False,
                message=f"Error executing assertion: {str(e)}",
            )

    def _check_status_code(
        self, assertion: TestAssertion, response_data: dict
    ) -> AssertionResult:
        """Check status code assertion"""
        actual = response_data.get("status_code", 0)
        expected = assertion.expected_value

        if assertion.operator == "equals":
            passed = actual == expected
            message = f"Status code is {actual}" if passed else f"Expected {expected}, got {actual}"
        elif assertion.operator == "not_equals":
            passed = actual != expected
            message = f"Status code is {actual}" if passed else f"Expected not {expected}, got {actual}"
        elif assertion.operator == "greater_than":
            passed = actual > expected
            message = f"Status code {actual} > {expected}" if passed else f"Expected > {expected}, got {actual}"
        elif assertion.operator == "less_than":
            passed = actual < expected
            message = f"Status code {actual} < {expected}" if passed else f"Expected < {expected}, got {actual}"
        elif assertion.operator == "in_range":
            min_val = assertion.expected_value
            max_val = assertion.expected_value_2
            passed = min_val <= actual <= max_val
            message = f"Status code {actual} in range [{min_val}, {max_val}]" if passed else f"Expected in range [{min_val}, {max_val}], got {actual}"
        else:
            passed = False
            message = f"Unknown operator: {assertion.operator}"

        return AssertionResult(
            assertion_id=assertion.id,
            passed=passed,
            message=message,
            expected=expected,
            actual=actual,
        )

    def _check_response_time(
        self, assertion: TestAssertion, response_data: dict
    ) -> AssertionResult:
        """Check response time assertion"""
        actual = response_data.get("response_time", 0)
        expected = assertion.expected_value

        if assertion.operator == "less_than":
            passed = actual < expected
            message = f"Response time {actual}ms < {expected}ms" if passed else f"Expected < {expected}ms, got {actual}ms"
        elif assertion.operator == "greater_than":
            passed = actual > expected
            message = f"Response time {actual}ms > {expected}ms" if passed else f"Expected > {expected}ms, got {actual}ms"
        elif assertion.operator == "in_range":
            min_val = assertion.expected_value
            max_val = assertion.expected_value_2
            passed = min_val <= actual <= max_val
            message = f"Response time {actual}ms in range [{min_val}, {max_val}]ms" if passed else f"Expected in range [{min_val}, {max_val}]ms, got {actual}ms"
        else:
            passed = False
            message = f"Unknown operator: {assertion.operator}"

        return AssertionResult(
            assertion_id=assertion.id,
            passed=passed,
            message=message,
            expected=expected,
            actual=actual,
        )

    def _check_header(
        self, assertion: TestAssertion, response_data: dict
    ) -> AssertionResult:
        """Check header assertion"""
        headers = response_data.get("headers", {})
        header_name = assertion.target
        actual = headers.get(header_name) if header_name else None

        if assertion.operator == "exists":
            passed = actual is not None
            message = f"Header '{header_name}' exists" if passed else f"Header '{header_name}' not found"
        elif assertion.operator == "not_exists":
            passed = actual is None
            message = f"Header '{header_name}' does not exist" if passed else f"Header '{header_name}' exists"
        elif assertion.operator == "equals":
            passed = actual == assertion.expected_value
            message = f"Header '{header_name}' equals '{assertion.expected_value}'" if passed else f"Expected '{assertion.expected_value}', got '{actual}'"
        elif assertion.operator == "contains":
            passed = actual and assertion.expected_value in str(actual)
            message = f"Header '{header_name}' contains '{assertion.expected_value}'" if passed else f"Expected to contain '{assertion.expected_value}', got '{actual}'"
        elif assertion.operator == "matches_regex":
            passed = actual and re.search(str(assertion.expected_value), str(actual)) is not None
            message = f"Header '{header_name}' matches pattern" if passed else f"Pattern not matched in '{actual}'"
        else:
            passed = False
            message = f"Unknown operator: {assertion.operator}"

        return AssertionResult(
            assertion_id=assertion.id,
            passed=passed,
            message=message,
            expected=assertion.expected_value,
            actual=actual,
        )

    def _check_json_body(
        self, assertion: TestAssertion, response_data: dict
    ) -> AssertionResult:
        """Check JSON body assertion using JSONPath"""
        body = response_data.get("body", {})
        json_path = assertion.target

        try:
            # Parse JSONPath
            path_expr = jsonpath_parse(json_path)
            matches = path_expr.find(body)
            actual = matches[0].value if matches else None

            if assertion.operator == "exists":
                passed = actual is not None
                message = f"Path '{json_path}' exists" if passed else f"Path '{json_path}' not found"
            elif assertion.operator == "not_exists":
                passed = actual is None
                message = f"Path '{json_path}' does not exist" if passed else f"Path '{json_path}' exists"
            elif assertion.operator == "equals":
                # Try to convert expected value to the same type as actual
                expected = assertion.expected_value
                if isinstance(actual, (int, float)) and isinstance(expected, str):
                    try:
                        expected = type(actual)(expected)
                    except:
                        pass
                passed = actual == expected
                message = f"Path '{json_path}' equals '{expected}'" if passed else f"Expected '{expected}', got '{actual}'"
            elif assertion.operator == "contains":
                passed = assertion.expected_value in str(actual)
                message = f"Path '{json_path}' contains '{assertion.expected_value}'" if passed else f"Expected to contain '{assertion.expected_value}', got '{actual}'"
            elif assertion.operator == "matches_regex":
                passed = re.search(str(assertion.expected_value), str(actual)) is not None
                message = f"Path '{json_path}' matches pattern" if passed else f"Pattern not matched in '{actual}'"
            else:
                passed = False
                message = f"Unknown operator: {assertion.operator}"

            return AssertionResult(
                assertion_id=assertion.id,
                passed=passed,
                message=message,
                expected=assertion.expected_value,
                actual=actual,
            )
        except Exception as e:
            return AssertionResult(
                assertion_id=assertion.id,
                passed=False,
                message=f"Error parsing JSONPath: {str(e)}",
            )

    def _check_text_body(
        self, assertion: TestAssertion, response_data: dict
    ) -> AssertionResult:
        """Check text body assertion"""
        body = response_data.get("body", "")
        if not isinstance(body, str):
            body = json.dumps(body)
        
        actual = body

        if assertion.operator == "contains":
            passed = assertion.expected_value in body
            message = f"Body contains '{assertion.expected_value}'" if passed else f"Expected to contain '{assertion.expected_value}'"
        elif assertion.operator == "not_contains":
            passed = assertion.expected_value not in body
            message = f"Body does not contain '{assertion.expected_value}'" if passed else f"Body contains '{assertion.expected_value}'"
        elif assertion.operator == "matches_regex":
            passed = re.search(str(assertion.expected_value), body) is not None
            message = f"Body matches pattern" if passed else f"Pattern not found in body"
        elif assertion.operator == "equals":
            passed = body == assertion.expected_value
            message = f"Body equals expected value" if passed else f"Body does not match expected value"
        else:
            passed = False
            message = f"Unknown operator: {assertion.operator}"

        return AssertionResult(
            assertion_id=assertion.id,
            passed=passed,
            message=message,
            expected=assertion.expected_value,
            actual=actual[:100] + "..." if len(actual) > 100 else actual,  # Truncate long bodies
        )

    def _execute_script(
        self, script: str, response_data: dict
    ) -> ScriptResult:
        """Execute Python test script"""
        try:
            # Create a mock response object
            class MockResponse:
                def __init__(self, data):
                    self.status_code = data.get("status_code", 0)
                    self.text = json.dumps(data.get("body", {}))
                    self.headers = data.get("headers", {})
                    self._json_data = data.get("body", {})

                def json(self):
                    return self._json_data

            response = MockResponse(response_data)

            # Create a restricted namespace
            namespace = {
                "response": response,
                "print": print,
                "assert": lambda cond, msg="Assertion failed": self._custom_assert(cond, msg),
                "__builtins__": {
                    "print": print,
                    "str": str,
                    "int": int,
                    "float": float,
                    "bool": bool,
                    "dict": dict,
                    "list": list,
                    "len": len,
                    "range": range,
                    "enumerate": enumerate,
                    "zip": zip,
                    "any": any,
                    "all": all,
                },
            }

            # Capture print output
            import io
            import sys
            old_stdout = sys.stdout
            sys.stdout = output_buffer = io.StringIO()

            try:
                # Execute the script
                exec(script, namespace)
                console_output = output_buffer.getvalue()
                
                return ScriptResult(
                    passed=True,
                    message="All tests passed",
                    console_output=console_output,
                )
            finally:
                sys.stdout = old_stdout

        except AssertionError as e:
            return ScriptResult(
                passed=False,
                message=f"Assertion failed: {str(e)}",
                error=str(e),
            )
        except Exception as e:
            return ScriptResult(
                passed=False,
                message=f"Script error: {str(e)}",
                error=str(e),
            )

    def _custom_assert(self, condition, message):
        """Custom assert function"""
        if not condition:
            raise AssertionError(message)


# Global service instance
test_execution_service = TestExecutionService()

