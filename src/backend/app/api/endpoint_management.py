from fastapi import APIRouter
from typing import List

from app.models.endpoint import Endpoint
from app.services.endpoint_management import endpoint_service
from app.db.connection import reset_database

router = APIRouter()


@router.get("/endpoints", response_model=List[Endpoint])
async def get_endpoints():
    """Get all endpoints"""
    return await endpoint_service.get_all_endpoints()


@router.post("/reset")
async def reset_database_endpoint():
    """Reset the database by removing and recreating it with seed data"""
    try:
        reset_database()
        return {"message": "Database reset successfully", "success": True}
    except Exception as e:
        return {"message": f"Failed to reset database: {str(e)}", "success": False}
