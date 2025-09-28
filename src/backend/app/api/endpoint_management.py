from fastapi import APIRouter, HTTPException
from typing import List

from app.models.endpoint_management import (
    Endpoint,
    CreateEndpointRequest,
    UpdateEndpointRequest,
    GetEndpointsResponse,
    GetEndpointResponse,
    CreateEndpointResponse,
    UpdateEndpointResponse,
    DeleteEndpointResponse,
    ResetDatabaseResponse,
)
from app.services.endpoint_management import endpoint_service
from app.db.connection import reset_database

router = APIRouter()


@router.get("/endpoints", response_model=GetEndpointsResponse)
async def get_endpoints():
    """Get all endpoints"""
    try:
        endpoints = await endpoint_service.get_all_endpoints()
        return GetEndpointsResponse(
            success=True,
            data=GetEndpointsResponse.GetEndpointsResponseData(endpoints=endpoints),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve endpoints: {str(e)}"
        )


@router.get("/endpoints/{endpoint_uuid}", response_model=GetEndpointResponse)
async def get_endpoint_by_uuid(endpoint_uuid: str):
    """Get a specific endpoint by UUID"""
    try:
        endpoint = await endpoint_service.get_endpoint_by_uuid(endpoint_uuid)
        if not endpoint:
            raise HTTPException(status_code=404, detail="Endpoint not found")
        return GetEndpointResponse(
            success=True,
            data=GetEndpointResponse.GetEndpointResponseData(endpoint=endpoint),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve endpoint: {str(e)}"
        )


@router.post("/endpoints", response_model=CreateEndpointResponse)
async def create_endpoint(request: CreateEndpointRequest):
    """Create a new endpoint"""
    try:
        # Create endpoint object from request data
        endpoint = Endpoint(
            operation_id=request.operation_id,
            name=request.name,
            summary=request.summary,
            description=request.description,
            method=request.method,
            path=request.path,
            base_url=request.base_url,
            cases=request.cases,
        )

        created_endpoint = await endpoint_service.create_endpoint(endpoint)
        return CreateEndpointResponse(
            success=True,
            data=CreateEndpointResponse.CreateEndpointResponseData(
                endpoint=created_endpoint
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to create endpoint: {str(e)}"
        )


@router.put("/endpoints/{endpoint_uuid}", response_model=UpdateEndpointResponse)
async def update_endpoint(endpoint_uuid: str, request: UpdateEndpointRequest):
    """Update an endpoint by UUID"""
    try:
        # Convert request to dict, excluding None values
        update_data = {k: v for k, v in request.dict().items() if v is not None}

        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")

        updated_endpoint = await endpoint_service.update_endpoint(
            endpoint_uuid, update_data
        )
        if not updated_endpoint:
            raise HTTPException(status_code=404, detail="Endpoint not found")

        return UpdateEndpointResponse(
            success=True,
            data=UpdateEndpointResponse.UpdateEndpointResponseData(
                endpoint=updated_endpoint
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to update endpoint: {str(e)}"
        )


@router.delete("/endpoints/{endpoint_uuid}", response_model=DeleteEndpointResponse)
async def delete_endpoint(endpoint_uuid: str):
    """Delete an endpoint by UUID"""
    try:
        success = await endpoint_service.delete_endpoint(endpoint_uuid)
        if not success:
            raise HTTPException(status_code=404, detail="Endpoint not found")

        return DeleteEndpointResponse(
            success=True,
            data=DeleteEndpointResponse.DeleteEndpointResponseData(
                message="Endpoint deleted successfully"
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to delete endpoint: {str(e)}"
        )


@router.post("/reset", response_model=ResetDatabaseResponse)
async def reset_database_endpoint():
    """Reset the database by removing and recreating it with seed data"""
    try:
        reset_database()
        return ResetDatabaseResponse(
            success=True,
            data=ResetDatabaseResponse.ResetDatabaseResponseData(
                message="Database reset successfully"
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to reset database: {str(e)}"
        )
