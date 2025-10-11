from pydantic import BaseModel
from typing import Optional, Dict, Any, Union

from .base import BaseResponse


class RequestHeader(BaseModel):
    key: str
    value: str


class RequestParam(BaseModel):
    key: str
    value: str


class AuthConfig(BaseModel):
    auth_type: str  # Bearer, Basic, None, etc.
    token: Optional[str] = None


class ApiRequest(BaseModel):
    method: str
    url: str
    headers: Optional[Dict[str, str]] = None
    query_params: Optional[Dict[str, str]] = None
    body: Optional[Union[str, Dict[str, Any]]] = None
    auth: Optional[AuthConfig] = None





class ApiResponse(BaseResponse):
    class Data(BaseModel):
        status_code: int
        headers: Dict[str, str]
        body: Any
        size: int
        response_time: float
    
    data: Data
