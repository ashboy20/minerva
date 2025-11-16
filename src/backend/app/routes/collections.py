import os
from fastapi import APIRouter, HTTPException
from app.models.collections import (
    GetCollectionsListResponse,
    ReorderItemRequest,
    ReorderItemResponse,
    ToggleOpenStateRequest,
    ToggleOpenStateResponse,
    CreateCollectionRequest,
    CreateCollectionResponse,
    DeleteCollectionRequest,
    DeleteCollectionResponse,
    CreateFolderRequest,
    CreateFolderResponse,
    DeleteFolderRequest,
    DeleteFolderResponse,
    CreateEndpointRequest,
    CreateEndpointResponse,
    DeleteEndpointRequest,
    DeleteEndpointResponse,
)
from app.services.collections import CollectionsService

router = APIRouter(tags=["collections"])

# Initialize service
collections_service = CollectionsService(
    collections_dir=os.getenv("COLLECTION_ROOT_DIR", "app/db/data/collections")
)


@router.get("/", response_model=GetCollectionsListResponse)
def get_collections_list():
    """
    Get list of all collections with basic information.
    Returns nested structure with folders and endpoints from global meta.yaml.
    """
    try:
        collections = collections_service.get_collections_list()
        return GetCollectionsListResponse(success=True, data=collections)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to load collections: {str(e)}"
        )


@router.post("/", response_model=CreateCollectionResponse)
def create_collection(request: CreateCollectionRequest):
    """
    Create a new collection with a directory and meta.yaml file.

    Args:
        request: CreateCollectionRequest with name for the collection

    Returns:
        CreateCollectionResponse with operation result
    """
    try:
        result = collections_service.create_collection(name=request.name)
        return CreateCollectionResponse(
            success=True, data=CreateCollectionResponse.CreateCollectionData(**result)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create collection: {str(e)}"
        )


@router.delete("/", response_model=DeleteCollectionResponse)
def delete_collection(request: DeleteCollectionRequest):
    """
    Delete a collection by UUID.
    Removes the collection from global meta.yaml and deletes its directory.

    Args:
        request: DeleteCollectionRequest with UUID of the collection

    Returns:
        DeleteCollectionResponse with operation result
    """
    try:
        result = collections_service.delete_collection(uuid=request.uuid)
        return DeleteCollectionResponse(
            success=True, data=DeleteCollectionResponse.DeleteCollectionData(**result)
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete collection: {str(e)}"
        )


@router.post("/reorder", response_model=ReorderItemResponse)
def reorder_collection_item(request: ReorderItemRequest):
    """
    Reorder a collection item by moving it to a new location.
    Updates the global meta.yaml file and moves physical files if needed.

    Args:
        request: ReorderItemRequest with:
            - item_uuid: UUID of item to move
            - destination_folder_uuid: UUID of destination (None for root)
            - destination_seq: Target sequence number in destination

    Returns:
        ReorderItemResponse with operation result
    """
    try:
        result = collections_service.reorder_item(
            item_uuid=request.item_uuid,
            destination_folder_uuid=request.destination_folder_uuid,
            destination_seq=request.destination_seq,
        )
        return ReorderItemResponse(success=True, data=result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reorder failed: {str(e)}")


@router.patch("/toggle-open", response_model=ToggleOpenStateResponse)
def toggle_open_state(request: ToggleOpenStateRequest):
    """
    Toggle the open state of a collection or folder.
    Updates the is_opened field in the global meta.yaml file.

    Args:
        request: ToggleOpenStateRequest with:
            - uuid: UUID of collection or folder
            - is_opened: New open state (True = opened, False = closed)

    Returns:
        ToggleOpenStateResponse with operation result
    """
    try:
        result = collections_service.toggle_open_state(
            uuid=request.uuid,
            is_opened=request.is_opened,
        )
        return ToggleOpenStateResponse(success=True, data=result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Toggle open state failed: {str(e)}"
        )


@router.post("/folder", response_model=CreateFolderResponse)
def create_folder(request: CreateFolderRequest):
    """
    Create a new folder within a collection or folder.

    Args:
        request: CreateFolderRequest with:
            - name: Display name for the folder
            - parent_uuid: UUID of the parent collection or folder

    Returns:
        CreateFolderResponse with operation result
    """
    try:
        result = collections_service.create_folder(
            name=request.name, parent_uuid=request.parent_uuid
        )
        return CreateFolderResponse(
            success=True, data=CreateFolderResponse.CreateFolderData(**result)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create folder: {str(e)}"
        )


@router.delete("/folder", response_model=DeleteFolderResponse)
def delete_folder(request: DeleteFolderRequest):
    """
    Delete a folder by UUID.
    Removes the folder from global meta.yaml and deletes its directory.

    Args:
        request: DeleteFolderRequest with UUID of the folder

    Returns:
        DeleteFolderResponse with operation result
    """
    try:
        result = collections_service.delete_folder(uuid=request.uuid)
        return DeleteFolderResponse(
            success=True, data=DeleteFolderResponse.DeleteFolderData(**result)
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete folder: {str(e)}"
        )


@router.post("/endpoint", response_model=CreateEndpointResponse)
def create_endpoint(request: CreateEndpointRequest):
    """
    Create a new endpoint within a collection or folder.

    Args:
        request: CreateEndpointRequest with:
            - name: Display name for the endpoint
            - parent_uuid: UUID of the parent collection or folder
            - method: HTTP method (default: GET)
            - base_url: Base URL (default: http://localhost:8000)
            - path: Request path (default: /)

    Returns:
        CreateEndpointResponse with operation result
    """
    try:
        result = collections_service.create_endpoint(
            name=request.name,
            parent_uuid=request.parent_uuid,
            method=request.method,
            base_url=request.base_url,
            path=request.path,
        )
        return CreateEndpointResponse(
            success=True, data=CreateEndpointResponse.CreateEndpointData(**result)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create endpoint: {str(e)}"
        )


@router.delete("/endpoint", response_model=DeleteEndpointResponse)
def delete_endpoint(request: DeleteEndpointRequest):
    """
    Delete an endpoint by UUID.
    Removes the endpoint from global meta.yaml and deletes its file.

    Args:
        request: DeleteEndpointRequest with UUID of the endpoint

    Returns:
        DeleteEndpointResponse with operation result
    """
    try:
        result = collections_service.delete_endpoint(uuid=request.uuid)
        return DeleteEndpointResponse(
            success=True, data=DeleteEndpointResponse.DeleteEndpointData(**result)
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete endpoint: {str(e)}"
        )
