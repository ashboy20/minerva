from typing import List
from app.models.endpoint import EndpointData
from app.db.connection import Session, engine
from sqlmodel import select

class EndpointManagementService:
    """Service for managing endpoints"""

    async def get_all_endpoints(self) -> List[EndpointData]:
        """Get all endpoints"""
        with Session(engine) as session:
            return session.exec(select(EndpointData)).all()

# Global service instance
endpoint_service = EndpointManagementService()
