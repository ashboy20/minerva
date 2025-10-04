from typing import List
from fastapi import APIRouter, HTTPException

from app.models.endpoint_management import (
    GetCollectionsResponse,
    PartialCollectionSchema,
    PartialEndpointSchema,
    PartialFolderSchema,
    PostCollectionResponse,
    ReorderRequest,
    ReorderResponse,
    UpdateItemRequest,
    UpdateItemResponse,
)
from app.services.endpoint_management import endpoint_service

router = APIRouter()


async def _populate_items_recursively(items):
    """Recursively populate items (folders and endpoints) with their children"""
    populated_items = []

    for item in items:
        if hasattr(item, "__class__") and item.__class__.__name__ == "Folder":
            # This is a folder, get its children recursively
            folder_items = await endpoint_service.find_items_by_parent_uuid(item.uuid)
            sorted_folder_items = sorted(folder_items, key=lambda i: i.position)
            child_schemas = await _populate_items_recursively(sorted_folder_items)

            # Create folder schema with populated items
            folder_schema = PartialFolderSchema(
                uuid=item.uuid,
                name=item.name,
                parent_uuid=item.parent_uuid,
                type="folder",
                items=child_schemas,
            ).model_dump(by_alias=True)
            populated_items.append(folder_schema)
        else:
            # This is an endpoint
            endpoint_schema = PartialEndpointSchema(
                uuid=item.uuid,
                name=item.name,
                parent_uuid=item.parent_uuid,
                type="endpoint",
                method=item.method,
                url=item.url,
            ).model_dump(by_alias=True)
            populated_items.append(endpoint_schema)
    return populated_items


@router.get("/collections", response_model=GetCollectionsResponse)
async def get_collections():
    """Get all collections with their items"""
    try:
        collections = await endpoint_service.get_collections()
        # Sort collections by their position attribute
        collections_sorted = sorted(collections, key=lambda c: c.position)
        result = []

        for collection in collections_sorted:
            # Get all items (folders and endpoints) for this collection
            items = await endpoint_service.find_items_by_collection_uuid(
                collection.uuid
            )

            # Convert items to schemas and populate folder children recursively
            populated_items = await _populate_items_recursively(items)

            # Create collection schema with populated items
            collection_schema = PartialCollectionSchema(
                uuid=collection.uuid,
                name=collection.name,
                items=populated_items,
            ).model_dump(by_alias=True)
            result.append(collection_schema)

        return GetCollectionsResponse(
            success=True,
            data=result,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve collections: {str(e)}"
        )


@router.post("/collection/create", response_model=PostCollectionResponse)
async def create_blank_collection():
    """Create a new blank collection"""
    try:
        await endpoint_service.create_blank_collection()
        return PostCollectionResponse(
            success=True,
            data={
                "message": "Collection created successfully",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create collection: {str(e)}"
        )


@router.put("/reorder", response_model=ReorderResponse)
async def reorder_items(request: ReorderRequest):
    """Reorder collections by UUIDs"""
    try:
        await endpoint_service.reorder_items(
            request.dragged_uuid,
            request.old_parent_uuid,
            request.new_parent_uuid,
            request.relative_index,
        )
        return ReorderResponse(
            success=True,
            data={
                "message": "Collections reordered successfully",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to reorder collections: {str(e)}"
        )


@router.put("/item/update", response_model=UpdateItemResponse)
async def update_item(request: UpdateItemRequest):
    """Update an item's fields by UUID"""
    try:
        success = False
        if request.type == "collection":
            success = await endpoint_service.update_collection(
                request.uuid, request.fields
            )
        elif request.type == "folder":
            success = await endpoint_service.update_folder(
                request.uuid, **request.fields
            )
        elif request.type == "endpoint":
            success = await endpoint_service.update_endpoint(
                request.uuid, **request.fields
            )

        if not success:
            raise HTTPException(
                status_code=404, detail=f"{request.type.title()} not found"
            )

        return UpdateItemResponse(
            success=True,
            data={"message": f"{request.type.title()} updated successfully"},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update {request.type}: {str(e)}"
        )
