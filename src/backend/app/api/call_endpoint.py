from fastapi import APIRouter
from typing import List

from app.models.call_endpoint import ApiRequest, ApiResponse
from app.services.call_endpoint import call_endpoint_service

router = APIRouter()


@router.post("/call", response_model=ApiResponse)
async def call_endpoint(request: ApiRequest):
    return await call_endpoint_service.call_endpoint(request)
