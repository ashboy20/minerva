from fastapi import APIRouter
from typing import List

from app.models.endpoint import EndpointData
from app.services.endpoint_management import endpoint_service

router = APIRouter()

@router.get("/endpoints", response_model=List[EndpointData])
async def get_endpoints():
    """Get all endpoints"""
    return await endpoint_service.get_all_endpoints()
