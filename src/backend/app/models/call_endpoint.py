from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union


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


class ApiResponse(BaseModel):
    status_code: int
    headers: Dict[str, str]
    body: Union[str, Dict[str, Any], List[Any]]
    response_time: float  # in milliseconds
    size: int  # response size in bytes
