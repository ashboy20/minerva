from fastapi import APIRouter, HTTPException

from app.models.endpoint_management import (
    CollectionSchema,
    FolderSchema,
    EndpointSchema,
    GetCollectionResponse,
    PostCollectionResponse,
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
            child_schemas = await _populate_items_recursively(folder_items)

            # Create folder schema with populated items
            folder_schema = FolderSchema(
                uuid=item.uuid,
                name=item.name,
                description=item.description,
                parent_uuid=item.parent_uuid,
                created_at=item.created_at,
                updated_at=item.updated_at,
                type="folder",
                items=child_schemas,
            )
            populated_items.append(folder_schema)
        else:
            # This is an endpoint
            endpoint_schema = EndpointSchema(
                uuid=item.uuid,
                name=item.name,
                description=item.description,
                parent_uuid=item.parent_uuid,
                created_at=item.created_at,
                updated_at=item.updated_at,
                type="endpoint",
                method=item.method,
                url=item.url,
                cases=item.cases,
            )
            populated_items.append(endpoint_schema)

    return populated_items


@router.get("/collections", response_model=GetCollectionResponse)
async def get_collections():
    """Get all collections with their items"""
    try:
        collections = await endpoint_service.get_collections()
        result = []

        for collection in collections:
            # Get all items (folders and endpoints) for this collection
            items = await endpoint_service.find_items_by_collection_uuid(
                collection.uuid
            )

            # Convert items to schemas and populate folder children recursively
            populated_items = await _populate_items_recursively(items)

            # Create collection schema with populated items
            collection_schema = CollectionSchema(
                uuid=collection.uuid,
                name=collection.name,
                description=collection.description,
                variables=collection.variables,
                items=populated_items,
                created_at=collection.created_at,
                updated_at=collection.updated_at,
            )
            result.append(collection_schema)

        return GetCollectionResponse(
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
        collection = await endpoint_service.create_blank_collection()
        return PostCollectionResponse(
            success=True,
            data={
                "message": "Collection created successfully",
                "collection": collection,
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create collection: {str(e)}"
        )


@router.put("/collection/{uuid}/rename")
async def rename_collection(uuid: str, new_name: str):
    """Rename a collection by UUID"""
    try:
        success = await endpoint_service.rename_collection(uuid, new_name)
        if not success:
            raise HTTPException(status_code=404, detail="Collection not found")

        return {"success": True, "message": "Collection renamed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to rename collection: {str(e)}"
        )


@router.put("/folder/{uuid}/rename")
async def rename_folder(uuid: str, new_name: str):
    """Rename a folder by UUID"""
    try:
        success = await endpoint_service.rename_folder(uuid, new_name)
        if not success:
            raise HTTPException(status_code=404, detail="Folder not found")

        return {"success": True, "message": "Folder renamed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to rename folder: {str(e)}"
        )


@router.put("/endpoint/{uuid}/rename")
async def rename_endpoint(uuid: str, new_name: str):
    """Rename an endpoint by UUID"""
    try:
        success = await endpoint_service.rename_endpoint(uuid, new_name)
        if not success:
            raise HTTPException(status_code=404, detail="Endpoint not found")

        return {"success": True, "message": "Endpoint renamed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to rename endpoint: {str(e)}"
        )
