from typing import List, Optional, Union
from sqlmodel import Field, SQLModel, Column, JSON
from pydantic import BaseModel
from datetime import datetime

from .base import BaseResponse


# child components
class Varialble(BaseModel):
    """Variable definition"""
    key: str = Field(description="Variable key")
    value: str = Field(description="Variable value")


class Header(BaseModel):
    """HTTP header definition"""
    name: str = Field(description="Header name")
    value: str = Field(description="Header value")


class PathParam(BaseModel):
    """Path parameter definition"""
    name: str = Field(description="Parameter name")
    value: str = Field(description="Parameter value")


class QueryParam(BaseModel):
    """Query parameter definition"""
    name: str = Field(description="Parameter name")
    value: str = Field(description="Parameter value")


class Auth(BaseModel):
    """Authentication configuration"""
    auth_type: str = Field(description="Authentication type (bearer, basic, etc.)", alias="type")
    token: Optional[str] = Field(default=None, description="Authentication token")
    username: Optional[str] = Field(default=None, description="Username for basic auth")
    password: Optional[str] = Field(default=None, description="Password for basic auth")


class Request(BaseModel):
    """Request configuration for a test case"""
    url: Optional[str] = Field(default=None, description="Request URL")
    headers: Optional[List[Header]] = Field(default=None, description="Request headers")
    query: Optional[List[QueryParam]] = Field(default=None, description="Query parameters")
    path_params: Optional[List[PathParam]] = Field(default=None, description="Path parameters")
    body: Optional[Union[str, dict]] = Field(default=None, description="Request body")
    auth: Optional[Auth] = Field(default=None, description="Authentication configuration")


class Response(BaseModel):
    """Expected response for a test case"""
    status_code: int = Field(description="Expected HTTP status code")
    headers: Optional[List[Header]] = Field(default=None, description="Expected response headers")
    body: Optional[Union[str, dict]] = Field(default=None, description="Expected response body")


class Case(BaseModel):
    """Case definition"""
    name: str = Field(description="Case name")
    description: Optional[str] = Field(default=None, description="Case description")
    request: Request = Field(description="Request configuration")
    response: Response = Field(description="Expected response")


# Database models - Normalized structure
class Item(BaseModel):
    """Item definition"""
    uuid: str = Field(description="Item UUID")


class Collection(SQLModel, table=True):
    """Collection containing endpoints and folders - primary storage model"""
    __tablename__ = "collections"

    uuid: str = Field(
        unique=True,
        index=True,
        primary_key=True,
        description="Unique UUID for collection identification",
    )
    name: str = Field(description="Collection name", required=True)
    description: str = Field(description="Collection description", nullable=True)
    variables: List[dict] = Field(description="Collection variables", sa_column=Column(JSON), default=[])
    items: List[dict] = Field(description="Collection items (folders and endpoints)", sa_column=Column(JSON), default=[])
    created_at: datetime = Field(
        default_factory=datetime.now(datetime.UTC),
        description="Timestamp when collection was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.now(datetime.UTC),
        description="Timestamp when collection was last updated"
    )


class Folder(SQLModel, table=True):
    """Normalized folder table for efficient querying"""
    __tablename__ = "folders"
    
    uuid: str = Field(unique=True, description="Unique UUID for folder identification", primary_key=True, index=True)
    name: str = Field(description="Folder name", required=True)
    description: Optional[str] = Field(default=None, description="Folder description", nullable=True)
    parent_uuid: Optional[str] = Field(default=None, description="Parent UUID (collection or folder)", required=True)
    items: List[dict] = Field(description="Folder items (endpoints)", sa_column=Column(JSON), default=[])
    created_at: datetime = Field(
        default_factory=datetime.now(datetime.UTC),
        description="Timestamp when folder was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.now(datetime.UTC),
        description="Timestamp when folder was last updated"
    )


class Endpoint(SQLModel, table=True):
    """Normalized endpoint table for efficient querying"""
    __tablename__ = "endpoints"
    
    uuid: str = Field(unique=True, description="Unique UUID for endpoint identification", primary_key=True, index=True)
    name: str = Field(description="Endpoint name", nullable=True)
    description: Optional[str] = Field(default=None, description="Endpoint description", nullable=True)
    method: str = Field(description="HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)", required=True)
    url: str = Field(description="Endpoint URL", required=True)
    parent_uuid: Optional[str] = Field(default=None, description="Parent UUID (collection or folder)", required=True)
    cases: List[dict] = Field(description="Endpoint cases", sa_column=Column(JSON), default=[])
    created_at: datetime = Field(
        default_factory=datetime.now(datetime.UTC),
        description="Timestamp when endpoint was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.now(datetime.UTC),
        description="Timestamp when endpoint was last updated"
    )


# endpoint request + response models
class GetCollectionResponse(BaseResponse):
    """Response model for GET /collections"""
    data: List[Collection] = Field(description="Collection data")


class PostCollectionRequest(BaseModel):
    """Request model for POST /collection"""
    collection: Collection = Field(description="Collection data")

class PostCollectionResponse(BaseResponse):
    """Response model for POST /collection"""
