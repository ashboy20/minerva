from fastapi import APIRouter
from typing import List

from app.models.endpoint import Endpoint
from app.services.endpoint_management import endpoint_service

router = APIRouter()


@router.get("/endpoints", response_model=List[Endpoint])
async def get_endpoints():
    """Get all endpoints"""
    return await endpoint_service.get_all_endpoints()
