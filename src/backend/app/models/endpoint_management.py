from typing import Dict, List, Optional, Union, Any
from sqlmodel import Field, SQLModel, Column, JSON
from pydantic import BaseModel
from datetime import datetime
import json
import uuid

from .base import BaseResponse


# Collection-level models
class CollectionInfo(BaseModel):
    """Collection metadata information"""
    collection_id: str = Field(description="Collection ID")
    name: str = Field(description="Collection name")
    description: str = Field(description="Collection description")


class CollectionVariable(BaseModel):
    """Collection variable definition"""
    key: str = Field(description="Variable key")
    value: str = Field(description="Variable value")


# Request/Response component models
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


# Hierarchical item models
class Item(BaseModel):
    """Base item that can be either a folder or an endpoint"""
    name: str = Field(description="Item name")
    type: str = Field(description="Item type: 'folder' or 'endpoint'")
    description: Optional[str] = Field(default=None, description="Item description")


class Folder(Item):
    """Folder containing other items"""
    type: str = Field(default="folder", description="Item type")
    item: Optional[List[Union['Folder', 'EndpointItem']]] = Field(default=None, description="Child items in folder")


class EndpointItem(Item):
    """Endpoint item withcases"""
    type: str = Field(default="endpoint", description="Item type")
    method: str = Field(description="HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)")
    cases: List[Case] = Field(description="Cases for this endpoint")


# Database models
class Collection(SQLModel, table=True):
    """Collection containing endpoints and folders - primary storage model"""
    id: int = Field(default=None, primary_key=True, index=True)
    uuid: str = Field(
        unique=True,
        description="Unique UUID for collection identification",
    )
    info: dict = Field(description="Collection metadata", sa_column=Column(JSON))
    variables: List[dict] = Field(description="Collection variables", sa_column=Column(JSON))
    items: List[dict] = Field(description="Collection items (folders and endpoints)", sa_column=Column(JSON))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when collection was created"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when collection was last updated"
    )


# # TODO: revise this
# # API Request/Response Models
# class CreateEndpointRequest(BaseModel):
#     operation_id: str
#     name: str
#     summary: str = None
#     description: str = None
#     method: str
#     path: str
#     base_url: str
#     cases: List[dict] = []


# class UpdateEndpointRequest(BaseModel):
#     operation_id: str = None
#     name: str = None
#     summary: str = None
#     description: str = None
#     method: str = None
#     path: str = None
#     base_url: str = None
#     cases: List[dict] = None


# # Response Models - Each endpoint has its own response model inheriting from BaseResponse
# class GetEndpointsResponse(BaseResponse):
#     """Response model for GET /endpoints"""

#     class GetEndpointsResponseData(BaseModel):
#         """Data structure for GET /endpoints response"""

#         endpoints: List[Endpoint] = Field(description="List of all endpoints")

#     data: GetEndpointsResponseData = Field(
#         description="Response data containing endpoints list"
#     )


# class GetEndpointResponse(BaseResponse):
#     """Response model for GET /endpoints/{uuid}"""

#     class GetEndpointResponseData(BaseModel):
#         """Data structure for GET /endpoints/{uuid} response"""

#         endpoint: Endpoint = Field(description="The requested endpoint")

#     data: GetEndpointResponseData = Field(
#         description="Response data containing single endpoint"
#     )


# class CreateEndpointResponse(BaseResponse):
#     """Response model for POST /endpoints"""

#     class CreateEndpointResponseData(BaseModel):
#         """Data structure for POST /endpoints response"""

#         endpoint: Endpoint = Field(description="The created endpoint")

#     data: CreateEndpointResponseData = Field(
#         description="Response data containing created endpoint"
#     )


# class UpdateEndpointResponse(BaseResponse):
#     """Response model for PUT /endpoints/{uuid}"""

#     class UpdateEndpointResponseData(BaseModel):
#         """Data structure for PUT /endpoints/{uuid} response"""

#         endpoint: Endpoint = Field(description="The updated endpoint")

#     data: UpdateEndpointResponseData = Field(
#         description="Response data containing updated endpoint"
#     )


# class DeleteEndpointResponse(BaseResponse):
#     """Response model for DELETE /endpoints/{uuid}"""

#     class DeleteEndpointResponseData(BaseModel):
#         """Data structure for DELETE /endpoints/{uuid} response"""

#         message: str = Field(description="Deletion confirmation message")

#     data: DeleteEndpointResponseData = Field(
#         description="Response data containing deletion confirmation"
#     )


# class ResetDatabaseResponse(BaseResponse):
#     """Response model for POST /reset"""

#     class ResetDatabaseResponseData(BaseModel):
#         """Data structure for POST /reset response"""

#         message: str = Field(description="Reset confirmation message")

#     data: ResetDatabaseResponseData = Field(
#         description="Response data containing reset confirmation"
#     )
