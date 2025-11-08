from typing import List, Optional, Literal
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


class CollectionItem(CollectionItemBase):
    """Minimal collection information for listing"""

    type: Literal["collection"] = "collection"
    items: List["CollectionTreeItem"] = Field(
        default=[], description="Items in collection"
    )


# Union type for tree items (folder or endpoint)
CollectionTreeItem = FolderItem | EndpointItem

# Update forward references
FolderItem.model_rebuild()
CollectionItem.model_rebuild()


# endpoint models
class GetCollectionsListResponse(BaseResponse):
    """Response model for GET /collections/list"""

    data: List[CollectionItem] = Field(
        description="List of collections with minimal data"
    )
