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
