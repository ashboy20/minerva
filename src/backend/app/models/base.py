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
