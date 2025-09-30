from typing import List, Optional, Union
import uuid
from sqlmodel import Field, SQLModel, Column, JSON, Relationship
from pydantic import BaseModel
from datetime import datetime, UTC

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

    auth_type: str = Field(
        description="Authentication type (bearer, basic, etc.)", alias="type"
    )
    token: Optional[str] = Field(default=None, description="Authentication token")
    username: Optional[str] = Field(default=None, description="Username for basic auth")
    password: Optional[str] = Field(default=None, description="Password for basic auth")


class Request(BaseModel):
    """Request configuration for a test case"""

    url: Optional[str] = Field(default=None, description="Request URL")
    headers: Optional[List[Header]] = Field(default=None, description="Request headers")
    query: Optional[List[QueryParam]] = Field(
        default=None, description="Query parameters"
    )
    path_params: Optional[List[PathParam]] = Field(
        default=None, description="Path parameters"
    )
    body: Optional[Union[str, dict]] = Field(default=None, description="Request body")
    auth: Optional[Auth] = Field(
        default=None, description="Authentication configuration"
    )


class Response(BaseModel):
    """Expected response for a test case"""

    status_code: int = Field(description="Expected HTTP status code")
    headers: Optional[List[Header]] = Field(
        default=None, description="Expected response headers"
    )
    body: Optional[Union[str, dict]] = Field(
        default=None, description="Expected response body"
    )


class Case(BaseModel):
    """Case definition"""

    name: str = Field(description="Case name")
    description: Optional[str] = Field(default=None, description="Case description")
    request: Request = Field(description="Request configuration")
    response: Response = Field(description="Expected response")


class Collection(SQLModel, table=True):
    """Collection containing endpoints and folders - primary storage model"""

    __tablename__ = "collections"

    uuid: str = Field(
        unique=True,
        index=True,
        primary_key=True,
        description="Unique UUID for collection identification",
        default_factory=lambda: str(uuid.uuid4()),
    )
    name: str = Field(description="Collection name")
    description: str = Field(description="Collection description", nullable=True)
    variables: List[dict] = Field(
        description="Collection variables", sa_column=Column(JSON), default=[]
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when collection was created",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when collection was last updated",
    )


class Folder(SQLModel, table=True):
    """Folder table for organizing endpoints"""

    __tablename__ = "folders"

    uuid: str = Field(
        unique=True,
        description="Unique UUID for folder identification",
        primary_key=True,
        index=True,
        default_factory=lambda: str(uuid.uuid4()),
    )
    name: str = Field(description="Folder name", nullable=False)
    description: Optional[str] = Field(
        default=None, description="Folder description", nullable=True
    )
    parent_uuid: Optional[str] = Field(
        default=None, description="Parent UUID (collection or folder)"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when folder was created",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when folder was last updated",
    )


class Endpoint(SQLModel, table=True):
    """Endpoint table for API endpoints"""

    __tablename__ = "endpoints"

    uuid: str = Field(
        unique=True,
        description="Unique UUID for endpoint identification",
        primary_key=True,
        index=True,
        default_factory=lambda: str(uuid.uuid4()),
    )
    name: str = Field(description="Endpoint name", nullable=False)
    description: Optional[str] = Field(
        default=None, description="Endpoint description", nullable=True
    )
    method: str = Field(
        description="HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)"
    )
    url: str = Field(description="Endpoint URL")
    cases: List[dict] = Field(
        description="Endpoint cases", sa_column=Column(JSON), default=[]
    )
    parent_uuid: Optional[str] = Field(
        default=None, description="Parent UUID (collection or folder)"
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when endpoint was created",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when endpoint was last updated",
    )


# endpoint request + response models
class CollectionSchema(BaseModel):
    """Collection schema for API responses"""

    uuid: str = Field(description="Collection UUID")
    name: str = Field(description="Collection name")
    description: Optional[str] = Field(
        default=None, description="Collection description"
    )
    variables: List[dict] = Field(description="Collection variables")
    items: List[Union["FolderSchema", "EndpointSchema"]] = Field(
        description="Collection items"
    )
    created_at: datetime = Field(description="Collection creation timestamp")
    updated_at: datetime = Field(description="Collection update timestamp")


class ItemSchema(BaseModel):
    """Base item schema"""

    uuid: str = Field(description="Item UUID")
    name: str = Field(description="Item name")
    description: Optional[str] = Field(default=None, description="Item description")
    parent_uuid: Optional[str] = Field(default=None, description="Parent UUID")
    created_at: datetime = Field(description="Item creation timestamp")
    updated_at: datetime = Field(description="Item update timestamp")


class FolderSchema(ItemSchema):
    """Folder schema for API responses"""

    type: str = Field(default="folder", description="Item type")

    items: List[Union["FolderSchema", "EndpointSchema"]] = Field(
        default=[], description="Folder items"
    )


class EndpointSchema(ItemSchema):
    """Endpoint schema for API responses"""

    type: str = Field(default="endpoint", description="Item type")

    method: str = Field(description="HTTP method")
    url: str = Field(description="Endpoint URL")
    cases: List[dict] = Field(default=[], description="Endpoint cases")


class GetCollectionResponse(BaseResponse):
    """Response model for GET /collections"""

    data: List[CollectionSchema] = Field(description="Collection data")


class PostCollectionRequest(BaseModel):
    """Request model for POST /collection"""

    name: str = Field(description="Collection name")
    description: Optional[str] = Field(
        default=None, description="Collection description"
    )
    variables: List[dict] = Field(description="Collection variables")


class PostCollectionResponse(BaseResponse):
    """Response model for POST /collection"""
