from typing import List
from app.models.endpoint import Endpoint, Request, Response
from app.db.connection import Session, engine
from sqlmodel import select


class EndpointManagementService:
    """Service for managing endpoints"""

    async def get_all_endpoints(self) -> List[Endpoint]:
        """Get all endpoints with their related request and response data"""
        with Session(engine) as session:
            statement = select(Endpoint)
            endpoints = session.exec(statement).all()
            return endpoints


# Global service instance
endpoint_service = EndpointManagementService()
