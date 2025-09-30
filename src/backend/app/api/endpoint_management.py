from fastapi import APIRouter, HTTPException
from typing import List

from app.models.endpoint_management import (
    GetCollectionResponse,
    PostCollectionRequest,
    PostCollectionResponse,
)
from app.services.endpoint_management import endpoint_service

router = APIRouter()


@router.get("/collections", response_model=GetCollectionResponse)
async def get_collections():
    """Get all collections"""
    try:
        collections = await endpoint_service.get_collections()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve collections: {str(e)}"
        )
    return GetCollectionResponse(
        success=True,
        data=collections,
    )

@router.post("/collection", response_model=PostCollectionResponse)
async def create_collection(request: PostCollectionRequest):
    """Create a new collection"""
    try:
        collection = request.collection
        await endpoint_service.create_collection(collection)
        return PostCollectionResponse(
            success=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create collection: {str(e)}")


# Search endpoints for locating items by UUID
@router.get("/search/item/{item_uuid}")
async def find_item_by_uuid(item_uuid: str):
    """Find an item (folder or endpoint) by UUID"""
    try:
        item, item_type = await endpoint_service.find_item_by_uuid(item_uuid)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return {
            "success": True,
            "data": {
                "item": item,
                "item_type": item_type
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find item: {str(e)}")


@router.get("/search/folder/{folder_uuid}")
async def find_folder_by_uuid(folder_uuid: str):
    """Find a folder by UUID"""
    try:
        folder = await endpoint_service.find_folder_by_uuid(folder_uuid)
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        return {
            "success": True,
            "data": {
                "folder": folder
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find folder: {str(e)}")


@router.get("/search/endpoint/{endpoint_uuid}")
async def find_endpoint_by_uuid(endpoint_uuid: str):
    """Find an endpoint by UUID"""
    try:
        endpoint = await endpoint_service.find_endpoint_by_uuid(endpoint_uuid)
        if not endpoint:
            raise HTTPException(status_code=404, detail="Endpoint not found")
        
        return {
            "success": True,
            "data": {
                "endpoint": endpoint
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find endpoint: {str(e)}")


@router.get("/search/parent/{parent_uuid}/items")
async def find_items_by_parent_uuid(parent_uuid: str):
    """Find all items (folders and endpoints) with the given parent UUID"""
    try:
        items = await endpoint_service.find_items_by_parent_uuid(parent_uuid)
        return {
            "success": True,
            "data": {
                "items": items,
                "count": len(items)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find items: {str(e)}")


@router.get("/search/collection/{collection_uuid}/items")
async def find_items_by_collection_uuid(collection_uuid: str):
    """Find all items (folders and endpoints) in a specific collection"""
    try:
        items = await endpoint_service.find_items_by_collection_uuid(collection_uuid)
        return {
            "success": True,
            "data": {
                "items": items,
                "count": len(items)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find items: {str(e)}")


# Folder management endpoints
@router.post("/folders")
async def create_folder(
    name: str,
    description: str = None,
    parent_uuid: str = None,
    parent_type: str = "collection",
    collection_uuid: str = None
):
    """Create a new folder"""
    try:
        folder = await endpoint_service.create_folder(
            name=name,
            description=description,
            parent_uuid=parent_uuid,
            parent_type=parent_type,
            collection_uuid=collection_uuid
        )
        return {
            "success": True,
            "data": {
                "folder": folder
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create folder: {str(e)}")


@router.put("/folders/{folder_uuid}")
async def update_folder(folder_uuid: str, name: str = None, description: str = None):
    """Update a folder"""
    try:
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
            
        folder = await endpoint_service.update_folder(folder_uuid, **update_data)
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
            
        return {
            "success": True,
            "data": {
                "folder": folder
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update folder: {str(e)}")


@router.delete("/folders/{folder_uuid}")
async def delete_folder(folder_uuid: str):
    """Delete a folder"""
    try:
        success = await endpoint_service.delete_folder(folder_uuid)
        if not success:
            raise HTTPException(status_code=404, detail="Folder not found")
            
        return {
            "success": True,
            "data": {
                "message": "Folder deleted successfully"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete folder: {str(e)}")


# Endpoint management endpoints
@router.post("/endpoints")
async def create_endpoint(
    name: str,
    method: str,
    description: str = None,
    parent_uuid: str = None,
    parent_type: str = "collection",
    collection_uuid: str = None,
    cases: List[dict] = None
):
    """Create a new endpoint"""
    try:
        endpoint = await endpoint_service.create_endpoint(
            name=name,
            method=method,
            description=description,
            parent_uuid=parent_uuid,
            parent_type=parent_type,
            collection_uuid=collection_uuid,
            cases=cases
        )
        return {
            "success": True,
            "data": {
                "endpoint": endpoint
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create endpoint: {str(e)}")


@router.put("/endpoints/{endpoint_uuid}")
async def update_endpoint(
    endpoint_uuid: str,
    name: str = None,
    method: str = None,
    description: str = None,
    cases: List[dict] = None
):
    """Update an endpoint"""
    try:
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if method is not None:
            update_data["method"] = method.upper()
        if description is not None:
            update_data["description"] = description
        if cases is not None:
            update_data["cases"] = cases
            
        endpoint = await endpoint_service.update_endpoint(endpoint_uuid, **update_data)
        if not endpoint:
            raise HTTPException(status_code=404, detail="Endpoint not found")
            
        return {
            "success": True,
            "data": {
                "endpoint": endpoint
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update endpoint: {str(e)}")


@router.delete("/endpoints/{endpoint_uuid}")
async def delete_endpoint(endpoint_uuid: str):
    """Delete an endpoint"""
    try:
        success = await endpoint_service.delete_endpoint(endpoint_uuid)
        if not success:
            raise HTTPException(status_code=404, detail="Endpoint not found")
            
        return {
            "success": True,
            "data": {
                "message": "Endpoint deleted successfully"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete endpoint: {str(e)}")


# Migration endpoint
@router.post("/migrate/collections-to-normalized")
async def migrate_collections_to_normalized():
    """Migrate all collections from JSON structure to normalized tables"""
    try:
        await endpoint_service.migrate_all_collections_to_normalized()
        return {
            "success": True,
            "data": {
                "message": "Collections migrated to normalized structure successfully"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to migrate collections: {str(e)}")

# @router.get("/endpoints", response_model=GetEndpointsResponse)
# async def get_endpoints():
#     """Get all endpoints"""
#     try:
#         endpoints = await endpoint_service.get_all_endpoints()
#         return GetEndpointsResponse(
#             success=True,
#             data=GetEndpointsResponse.GetEndpointsResponseData(endpoints=endpoints),
#         )
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to retrieve endpoints: {str(e)}"
#         )


# @router.get("/endpoints/{endpoint_uuid}", response_model=GetEndpointResponse)
# async def get_endpoint_by_uuid(endpoint_uuid: str):
#     """Get a specific endpoint by UUID"""
#     try:
#         endpoint = await endpoint_service.get_endpoint_by_uuid(endpoint_uuid)
#         if not endpoint:
#             raise HTTPException(status_code=404, detail="Endpoint not found")
#         return GetEndpointResponse(
#             success=True,
#             data=GetEndpointResponse.GetEndpointResponseData(endpoint=endpoint),
#         )
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to retrieve endpoint: {str(e)}"
#         )


# @router.post("/endpoints", response_model=CreateEndpointResponse)
# async def create_endpoint(request: CreateEndpointRequest):
#     """Create a new endpoint"""
#     try:
#         # Create endpoint object from request data
#         endpoint = Endpoint(
#             operation_id=request.operation_id,
#             name=request.name,
#             summary=request.summary,
#             description=request.description,
#             method=request.method,
#             path=request.path,
#             base_url=request.base_url,
#             cases=request.cases,
#         )

#         created_endpoint = await endpoint_service.create_endpoint(endpoint)
#         return CreateEndpointResponse(
#             success=True,
#             data=CreateEndpointResponse.CreateEndpointResponseData(
#                 endpoint=created_endpoint
#             ),
#         )
#     except Exception as e:
#         raise HTTPException(
#             status_code=400, detail=f"Failed to create endpoint: {str(e)}"
#         )


# @router.put("/endpoints/{endpoint_uuid}", response_model=UpdateEndpointResponse)
# async def update_endpoint(endpoint_uuid: str, request: UpdateEndpointRequest):
#     """Update an endpoint by UUID"""
#     try:
#         # Convert request to dict, excluding None values
#         update_data = {k: v for k, v in request.dict().items() if v is not None}

#         if not update_data:
#             raise HTTPException(status_code=400, detail="No update data provided")

#         updated_endpoint = await endpoint_service.update_endpoint(
#             endpoint_uuid, update_data
#         )
#         if not updated_endpoint:
#             raise HTTPException(status_code=404, detail="Endpoint not found")

#         return UpdateEndpointResponse(
#             success=True,
#             data=UpdateEndpointResponse.UpdateEndpointResponseData(
#                 endpoint=updated_endpoint
#             ),
#         )
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=400, detail=f"Failed to update endpoint: {str(e)}"
#         )


# @router.delete("/endpoints/{endpoint_uuid}", response_model=DeleteEndpointResponse)
# async def delete_endpoint(endpoint_uuid: str):
#     """Delete an endpoint by UUID"""
#     try:
#         success = await endpoint_service.delete_endpoint(endpoint_uuid)
#         if not success:
#             raise HTTPException(status_code=404, detail="Endpoint not found")

#         return DeleteEndpointResponse(
#             success=True,
#             data=DeleteEndpointResponse.DeleteEndpointResponseData(
#                 message="Endpoint deleted successfully"
#             ),
#         )
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=400, detail=f"Failed to delete endpoint: {str(e)}"
#         )


# @router.post("/reset", response_model=ResetDatabaseResponse)
# async def reset_database_endpoint():
#     """Reset the database by removing and recreating it with seed data"""
#     try:
#         reset_database()
#         return ResetDatabaseResponse(
#             success=True,
#             data=ResetDatabaseResponse.ResetDatabaseResponseData(
#                 message="Database reset successfully"
#             ),
#         )
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to reset database: {str(e)}"
#         )
