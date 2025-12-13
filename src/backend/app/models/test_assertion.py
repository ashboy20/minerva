from pydantic import BaseModel
from typing import Optional, List, Any, Union
from app.models.base import BaseResponse


class TestAssertion(BaseModel):
    """Test assertion model"""
    id: str
    type: str  # status_code, response_time, header, json_body, text_body
    operator: str  # equals, not_equals, greater_than, less_than, contains, etc.
    target: Optional[str] = None  # For headers or JSON paths
    expected_value: Optional[Union[str, int, float, bool]] = None
    expected_value_2: Optional[Union[str, int, float]] = None  # For range assertions
    enabled: bool = True


class AssertionResult(BaseModel):
    """Result of a single assertion"""
    assertion_id: str
    passed: bool
    message: str
    expected: Optional[Any] = None
    actual: Optional[Any] = None


class ScriptResult(BaseModel):
    """Result of script execution"""
    passed: bool
    message: Optional[str] = None
    console_output: Optional[str] = None
    error: Optional[str] = None


class TestExecutionResult(BaseModel):
    """Overall test execution result"""
    passed: bool
    total_assertions: int
    passed_assertions: int
    failed_assertions: int
    assertion_results: List[AssertionResult]
    script_result: Optional[ScriptResult] = None
    execution_time_ms: float


class ExecuteTestsRequest(BaseModel):
    """Request to execute tests against a response"""
    response_data: dict  # The API response data
    assertions: List[TestAssertion]
    test_script: Optional[str] = None


class ExecuteTestsResponse(BaseResponse):
    """Response from test execution"""
    class Data(BaseModel):
        result: TestExecutionResult
    
    data: Data

