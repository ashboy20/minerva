from typing import List, Literal, Optional, Union, Dict, Any
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

    type: str = Field(description="Authentication type (bearer, basic, etc.)")
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

    uuid: str = Field(
        unique=True,
        index=True,
        primary_key=True,
        description="Unique UUID for case identification",
        default_factory=lambda: str(uuid.uuid4()),
    )
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
    position: int = Field(description="Collection position")
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
    position: int = Field(description="Position in parent")
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
    position: int = Field(description="Position in parent")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when endpoint was created",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when endpoint was last updated",
    )


# endpoint request + response models
class PartialCollectionSchema(BaseModel):
    """Partial collection schema for API responses"""

    uuid: str = Field(description="Collection UUID")
    name: str = Field(description="Collection name")
    type: str = Field(description="Collection type", default="collection")
    items: List[Union["PartialFolderSchema", "PartialEndpointSchema"]] = Field(
        description="Collection items"
    )


class CollectionSchema(PartialCollectionSchema):
    """Collection schema for API responses"""

    description: Optional[str] = Field(
        default=None, description="Collection description"
    )
    variables: List[dict] = Field(description="Collection variables")
    items: List[Union["FolderSchema", "EndpointSchema"]] = Field(
        default=[], description="Collection items"
    )
    created_at: datetime = Field(description="Collection creation timestamp")
    updated_at: datetime = Field(description="Collection update timestamp")


class PartialItemSchema(BaseModel):
    """Partial item schema for API responses"""

    uuid: str = Field(description="Item UUID")
    name: str = Field(description="Item name")
    type: Literal["folder", "endpoint"] = Field(description="Item type")
    parent_uuid: Optional[str] = Field(default=None, description="Parent UUID")


class ItemSchema(PartialItemSchema):
    """Base item schema"""

    description: Optional[str] = Field(default=None, description="Item description")
    created_at: datetime = Field(description="Item creation timestamp")
    updated_at: datetime = Field(description="Item update timestamp")


class PartialFolderSchema(PartialItemSchema):
    """Partial folder schema for API responses"""

    type: str = Field(description="Item type", default="folder")
    items: List[Union["PartialFolderSchema", "PartialEndpointSchema"]] = Field(
        default=[], description="Folder items"
    )


class FolderSchema(ItemSchema):
    """Folder schema for API responses"""

    items: List[Union["FolderSchema", "EndpointSchema"]] = Field(
        default=[], description="Folder items"
    )


class PartialEndpointSchema(PartialItemSchema):
    """Partial endpoint schema for API responses"""

    type: str = Field(description="Item type", default="endpoint")
    method: str = Field(description="HTTP method")
    url: str = Field(description="Endpoint URL")


class EndpointSchema(ItemSchema, PartialEndpointSchema):
    """Endpoint schema for API responses"""

    cases: List[dict] = Field(default=[], description="Endpoint cases")


class CreateItemRequest(BaseModel):
    """Request model for POST /item/create"""

    type: Literal["folder", "endpoint"]
    name: str
    description: Optional[str] = None
    parent_uuid: Optional[str] = None
    # Endpoint-specific fields
    method: Optional[str] = None
    url: Optional[str] = None
    cases: Optional[List[dict]] = None


class CreateItemResponse(BaseResponse):
    """Response model for POST /item/create"""

    class Data(BaseModel):
        item: Union[PartialFolderSchema, PartialEndpointSchema]
        position: int

    data: Data


class GetCollectionsResponse(BaseResponse):
    """Response model for GET /collections"""

    data: List[PartialCollectionSchema] = Field(description="Collection data")


class PostCollectionResponse(BaseResponse):
    """Response model for POST /collection"""

    data: dict = Field(description="The response data payload")


class ReorderRequest(BaseModel):
    """Request model for PUT /reorder"""

    dragged_uuid: str = Field(description="Dragged UUID")
    old_parent_uuid: Union[str, int] = Field(
        default=None, description="Old parent UUID"
    )
    new_parent_uuid: Optional[str] = Field(default=None, description="Parent UUID")
    relative_index: int = Field(description="Relative index")


class ReorderResponse(BaseResponse):
    """Response model for PUT /reorder"""


class UpdateItemRequest(BaseModel):
    """Request model for updating any item (collection, folder, or endpoint)"""

    uuid: str = Field(description="UUID of the item to update")
    fields: Dict[str, Any] = Field(description="Fields to update and their new values")


class UpdateItemResponse(BaseResponse):
    """Response model for update operations"""

    data: dict = Field(description="The response data payload")


class DeleteItemRequest(BaseModel):
    """Request model for POST /item/delete"""

    uuid: str = Field(description="UUID of the item to delete")


class DeleteItemResponse(BaseResponse):
    """Response model for POST /item/delete"""

    class Data(BaseModel):
        """Data model for delete response"""

        uuid: str = Field(description="UUID of the deleted item")
        type: str = Field(
            description="Type of the deleted item (collection, folder, or endpoint)"
        )
        name: str = Field(description="Name of the deleted item")
        message: str = Field(description="Success message")

    data: Data = Field(description="The response data payload")


class GetEndpointPathParams(BaseModel):
    """Path parameters for GET /endpoint-management/endpoint/{uuid}"""

    uuid: str = Field(description="UUID of the endpoint to retrieve")


class GetEndpointResponse(BaseResponse):
    """Response model for GET /endpoint-management/endpoint/{uuid}"""

    data: EndpointSchema = Field(description="The endpoint data")
