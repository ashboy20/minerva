from fastapi import APIRouter
from app.models.collections import GetCollectionsListResponse
from app.services.collections import CollectionsService

router = APIRouter(tags=["collections"])

# Initialize service
collections_service = CollectionsService()


@router.get("/", response_model=GetCollectionsListResponse)
def get_collections_list():
    """
    Get list of all collections with minimal data (uuid, name, seq).
    Returns nested structure with folders and endpoints.
    """
    collections = collections_service.get_collections_list()

    return GetCollectionsListResponse(success=True, data=collections)
