from typing import Any, Dict, TypeVar, Generic
from pydantic import BaseModel, Field

# Generic type for data payload
DataT = TypeVar("DataT")


class BaseResponse(BaseModel, Generic[DataT]):
    """
    Simple base response model for all API responses.
    Contains only success status and data payload.
    """

    success: bool = Field(description="Indicates if the request was successful")
    data: DataT = Field(description="The response data payload")


def success_response(data: Dict[str, Any]) -> BaseResponse:
    """Helper function to create a successful response"""
    return BaseResponse(success=True, data=data)


def error_response(error_message: str) -> BaseResponse:
    """Helper function to create an error response"""
    return BaseResponse(success=False, data={"error": error_message})
