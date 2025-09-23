from typing import List, Optional
from backend.app.models.endpoint_management import Endpoint, Request, Response
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

    async def get_endpoint_by_uuid(self, endpoint_uuid: str) -> Optional[Endpoint]:
        """Get a specific endpoint by its UUID"""
        with Session(engine) as session:
            statement = select(Endpoint).where(Endpoint.uuid == endpoint_uuid)
            endpoint = session.exec(statement).first()
            return endpoint

    async def create_endpoint(self, endpoint: Endpoint) -> Endpoint:
        """Create a new endpoint"""
        with Session(engine) as session:
            session.add(endpoint)
            session.commit()
            session.refresh(endpoint)
            return endpoint

    async def update_endpoint(
        self, endpoint_uuid: str, endpoint_data: dict
    ) -> Optional[Endpoint]:
        """Update an endpoint by UUID"""
        with Session(engine) as session:
            statement = select(Endpoint).where(Endpoint.uuid == endpoint_uuid)
            endpoint = session.exec(statement).first()
            if not endpoint:
                return None

            for key, value in endpoint_data.items():
                if hasattr(endpoint, key):
                    setattr(endpoint, key, value)

            session.add(endpoint)
            session.commit()
            session.refresh(endpoint)
            return endpoint

    async def delete_endpoint(self, endpoint_uuid: str) -> bool:
        """Delete an endpoint by UUID"""
        with Session(engine) as session:
            statement = select(Endpoint).where(Endpoint.uuid == endpoint_uuid)
            endpoint = session.exec(statement).first()
            if not endpoint:
                return False

            session.delete(endpoint)
            session.commit()
            return True


# Global service instance
endpoint_service = EndpointManagementService()
