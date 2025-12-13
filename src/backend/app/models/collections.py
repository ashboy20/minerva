from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from .base import BaseResponse


class CollectionItemBase(BaseModel):
    """Base model for collection items"""

    uuid: str = Field(description="Item UUID")
    name: str = Field(description="Item name")
    seq: int = Field(description="Item sequence/position")


class EndpointItem(CollectionItemBase):
    """Minimal endpoint information for listing"""

    type: Literal["endpoint"] = "endpoint"
    method: str = Field(description="HTTP method (GET, POST, etc.)")


class FolderItem(CollectionItemBase):
    """Minimal folder information for listing"""

    type: Literal["folder"] = "folder"
    items: List["CollectionTreeItem"] = Field(default=[], description="Items in folder")
    is_opened: bool = Field(description="Folder is opened")


class CollectionItem(CollectionItemBase):
    """Minimal collection information for listing"""

    type: Literal["collection"] = "collection"
    items: List["CollectionTreeItem"] = Field(
        default=[], description="Items in collection"
    )
    is_opened: bool = Field(description="Collection is opened")


# Union type for tree items (folder or endpoint)
CollectionTreeItem = FolderItem | EndpointItem

# Update forward references
FolderItem.model_rebuild()
CollectionItem.model_rebuild()


# API request/response models
class GetCollectionsListResponse(BaseResponse):
    """Response model for GET /collections/"""

    data: List[CollectionItem] = Field(
        description="List of collections with minimal data"
    )


class ReorderItemRequest(BaseModel):
    """Request model for reordering an item"""

    item_uuid: str = Field(description="UUID of the item to move")
    destination_folder_uuid: Optional[str] = Field(
        default=None,
        description="UUID of destination folder/collection (None for root)",
    )
    destination_seq: int = Field(
        description="Target sequence number in the destination"
    )


class ReorderItemResponse(BaseResponse):
    """Response model for item reorder"""

    data: Optional[Dict[str, Any]] = Field(
        default=None, description="Reorder operation result"
    )


class ToggleOpenStateRequest(BaseModel):
    """Request model for toggling open state"""

    uuid: str = Field(description="UUID of the item (collection or folder)")
    is_opened: bool = Field(description="New open state")


class ToggleOpenStateResponse(BaseResponse):
    """Response model for toggle open state"""

    class ToggleOpenStateData(BaseModel):
        """Data model for toggle open state result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the item that was toggled")
        is_opened: bool = Field(description="New open state after toggle")

    data: Optional[ToggleOpenStateData] = Field(
        default=None, description="Toggle operation result"
    )


class CreateCollectionRequest(BaseModel):
    """Request model for creating a new collection"""

    name: str = Field(description="Display name for the collection")


class CreateCollectionResponse(BaseResponse):
    """Response model for collection creation"""

    class CreateCollectionData(BaseModel):
        """Data model for collection creation result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the created collection")
        name: str = Field(description="Display name of the created collection")
        slug: str = Field(description="Slug (directory name) of the created collection")

    data: Optional[CreateCollectionData] = Field(
        default=None, description="Collection creation result"
    )


class DeleteCollectionRequest(BaseModel):
    """Request model for deleting a collection"""

    uuid: str = Field(description="UUID of the collection to delete")


class DeleteCollectionResponse(BaseResponse):
    """Response model for collection deletion"""

    class DeleteCollectionData(BaseModel):
        """Data model for collection deletion result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the deleted collection")
        slug: str = Field(description="Slug of the deleted collection")

    data: Optional[DeleteCollectionData] = Field(
        default=None, description="Collection deletion result"
    )


class CreateFolderRequest(BaseModel):
    """Request model for creating a new folder"""

    name: str = Field(description="Display name for the folder")
    parent_uuid: str = Field(description="UUID of the parent collection or folder")


class CreateFolderResponse(BaseResponse):
    """Response model for folder creation"""

    class CreateFolderData(BaseModel):
        """Data model for folder creation result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the created folder")
        name: str = Field(description="Display name of the created folder")
        slug: str = Field(description="Slug (directory name) of the created folder")

    data: Optional[CreateFolderData] = Field(
        default=None, description="Folder creation result"
    )


class DeleteFolderRequest(BaseModel):
    """Request model for deleting a folder"""

    uuid: str = Field(description="UUID of the folder to delete")


class DeleteFolderResponse(BaseResponse):
    """Response model for folder deletion"""

    class DeleteFolderData(BaseModel):
        """Data model for folder deletion result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the deleted folder")
        slug: str = Field(description="Slug of the deleted folder")

    data: Optional[DeleteFolderData] = Field(
        default=None, description="Folder deletion result"
    )


class CreateEndpointRequest(BaseModel):
    """Request model for creating a new endpoint"""

    name: str = Field(description="Display name for the endpoint")
    parent_uuid: str = Field(description="UUID of the parent collection or folder")
    method: str = Field(default="GET", description="HTTP method (GET, POST, PUT, etc.)")
    base_url: str = Field(default="http://localhost:8000", description="Base URL")
    path: str = Field(default="/", description="Request path")


class CreateEndpointResponse(BaseResponse):
    """Response model for endpoint creation"""

    class CreateEndpointData(BaseModel):
        """Data model for endpoint creation result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the created endpoint")
        name: str = Field(description="Display name of the created endpoint")
        slug: str = Field(description="Slug (file name) of the created endpoint")

    data: Optional[CreateEndpointData] = Field(
        default=None, description="Endpoint creation result"
    )


class DeleteEndpointRequest(BaseModel):
    """Request model for deleting an endpoint"""

    uuid: str = Field(description="UUID of the endpoint to delete")


class DeleteEndpointResponse(BaseResponse):
    """Response model for endpoint deletion"""

    class DeleteEndpointData(BaseModel):
        """Data model for endpoint deletion result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the deleted endpoint")
        slug: str = Field(description="Slug of the deleted endpoint")

    data: Optional[DeleteEndpointData] = Field(
        default=None, description="Endpoint deletion result"
    )


# Full endpoint details models
class EndpointRow(BaseModel):
    """Key-value row for headers, params, etc."""

    row_id: int
    keyValue: str
    value: str
    enabled: bool
    disabled: Optional[bool] = None


class EndpointAuth(BaseModel):
    """Authentication configuration"""

    auth_type: str
    token: str


class EndpointRequest(BaseModel):
    """Request configuration"""

    base_url: Optional[str] = None
    full_url: Optional[str] = None
    path: Optional[str] = None
    headers: List[EndpointRow] = []
    query_params: List[EndpointRow] = []
    path_params: List[EndpointRow] = []
    body: Optional[Dict[str, Any]] = None
    auth: Optional[EndpointAuth] = None


class EndpointResponse(BaseModel):
    """Response configuration"""

    status_code: Optional[int] = 200
    headers: List[EndpointRow] = []
    body: Optional[Dict[str, Any]] = None


class EndpointTestAssertion(BaseModel):
    """Test assertion"""

    id: str
    type: str
    operator: str
    target: Optional[str] = None
    expected_value: Optional[Any] = None
    expected_value_2: Optional[Any] = None
    enabled: bool = True


class EndpointCase(BaseModel):
    """Endpoint test case"""

    id: Optional[int] = 1
    uuid: Optional[str] = None
    name: str
    description: Optional[str] = ""
    request: EndpointRequest
    response: Optional[EndpointResponse] = None
    test_assertions: Optional[List[EndpointTestAssertion]] = None
    test_script: Optional[str] = None


class EndpointDetail(BaseModel):
    """Full endpoint details"""

    id: Optional[int] = 0
    uuid: str
    name: str
    summary: Optional[str] = ""
    description: Optional[str] = ""
    method: str
    url: Optional[str] = ""
    cases: List[EndpointCase]


class GetEndpointDetailResponse(BaseResponse):
    """Response model for GET /collections/endpoint/{uuid}"""

    data: EndpointDetail


class UpdateEndpointRequest(BaseModel):
    """Request model for updating an endpoint"""

    name: Optional[str] = None
    description: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    base_url: Optional[str] = None
    path: Optional[str] = None
    cases: Optional[List[EndpointCase]] = None


class UpdateEndpointResponse(BaseResponse):
    """Response model for endpoint update"""

    class UpdateEndpointData(BaseModel):
        """Data model for update result"""

        message: str = Field(description="Operation result message")
        uuid: str = Field(description="UUID of the updated endpoint")

    data: Optional[UpdateEndpointData] = Field(
        default=None, description="Update operation result"
    )
