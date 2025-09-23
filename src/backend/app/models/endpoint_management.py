from typing import Dict, List, Optional
from sqlmodel import Field, SQLModel, Column, JSON
from pydantic import BaseModel
import json
import uuid


class Row(BaseModel):
    row_id: int = Field(description="ID of the row")
    keyValue: str = Field(description="Key value of the row")
    value: str = Field(description="Value of the row")
    enabled: bool = Field(description="Enabled of the row")


class Auth(BaseModel):
    auth_type: str = Field(description="Type of the auth", alias="auth")
    token: str = Field(description="Token of the auth")


class Request(BaseModel):
    headers: Optional[List[dict]] = Field(
        default=None, description="Headers of the request"
    )
    query_params: Optional[List[dict]] = Field(
        default=None, description="Query params of the request"
    )
    path_params: Optional[List[dict]] = Field(
        default=None, description="Path params of the request"
    )
    body: Optional[dict] = Field(default=None, description="Body of the request")
    auth: Optional[dict] = Field(default=None, description="Auth of the request")


class Response(BaseModel):
    status_code: int = Field(description="Status code of the response")
    headers: Optional[List[dict]] = Field(
        default=None, description="Headers of the response"
    )
    body: Optional[dict] = Field(default=None, description="Body of the response")


class Case(BaseModel):
    name: str = Field(description="Name of the case")
    description: Optional[str] = Field(
        default=None, description="Description of the case"
    )
    request: Optional[dict] = Field(default=None, description="Request of the case")
    response: Optional[dict] = Field(default=None, description="Response of the case")


class Endpoint(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    uuid: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        unique=True,
        index=True,
        description="Unique UUID for endpoint identification",
    )
    operation_id: str = Field(description="Operation ID of the endpoint")
    name: str = Field(description="Name of the endpoint")
    summary: Optional[str] = Field(default=None, description="Summary of the endpoint")
    description: Optional[str] = Field(
        default=None, description="Description of the endpoint"
    )
    method: str = Field(
        description="HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)"
    )
    path: str = Field(description="Path of the endpoint")
    base_url: str = Field(description="Base URL of the endpoint")
    cases: List[dict] = Field(
        description="Cases of the endpoint", sa_column=Column(JSON)
    )


# API Request/Response Models
class CreateEndpointRequest(BaseModel):
    operation_id: str
    name: str
    summary: str = None
    description: str = None
    method: str
    path: str
    base_url: str
    cases: List[dict] = []


class UpdateEndpointRequest(BaseModel):
    operation_id: str = None
    name: str = None
    summary: str = None
    description: str = None
    method: str = None
    path: str = None
    base_url: str = None
    cases: List[dict] = None


class DeleteEndpointResponse(BaseModel):
    success: bool
    message: str
