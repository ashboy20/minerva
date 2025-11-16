import os
from fastapi import APIRouter, HTTPException
from app.models.collections import (
    GetCollectionsListResponse,
    ReorderItemRequest,
    ReorderItemResponse,
    ToggleOpenStateRequest,
    ToggleOpenStateResponse,
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
