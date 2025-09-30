from typing import List, Optional, Union
from app.models.endpoint_management import Collection, Folder, Endpoint
from app.db.connection import Session, engine
from sqlmodel import select
import uuid as uuid_lib


class EndpointManagementService:
    """Service for managing endpoints and folders"""

    # Collection methods
    async def get_collections(self) -> List[Collection]:
        """Get all collections"""
        with Session(engine) as session:
            statement = select(Collection)
            collections = session.exec(statement).all()
            return collections

    async def create_collection(self, collection: Collection) -> Collection:
        """Create a new collection"""
        with Session(engine) as session:
            session.add(collection)
            session.commit()
            session.refresh(collection)
            return collection

    async def remove_collection(self, uuid: str) -> bool:
        """Remove a collection by UUID"""
        with Session(engine) as session:
            statement = select(Collection).where(Collection.uuid == uuid)
            collection = session.exec(statement).first()
            if collection:
                session.delete(collection)
                session.commit()
                return True
            return False

    async def update_collection(self, uuid: str, items: dict) -> Collection:
        """Update a collection by UUID"""
        with Session(engine) as session:
            statement = select(Collection).where(Collection.uuid == uuid)
            collection = session.exec(statement).first()
            if collection:
                for key, value in items.items():
                    setattr(collection, key, value)
                session.add(collection)
                session.commit()
                session.refresh(collection)
            return collection

    async def find_parent_by_uuid(
        self, uuid: str
    ) -> Optional[Union[Folder, Collection]]:
        """Find a parent folder or collection by UUID"""
        with Session(engine) as session:
            statement = select(Folder).where(Folder.uuid == uuid)
            folder = session.exec(statement).first()
            if folder:
                return folder
            statement = select(Collection).where(Collection.uuid == uuid)
            collection = session.exec(statement).first()
            return collection

    async def find_folder_by_uuid(self, folder_uuid: str) -> Optional[Folder]:
        """Find a folder by UUID"""
        with Session(engine) as session:
            statement = select(Folder).where(Folder.uuid == folder_uuid)
            return session.exec(statement).first()

    async def find_endpoint_by_uuid(self, endpoint_uuid: str) -> Optional[Endpoint]:
        """Find an endpoint by UUID"""
        with Session(engine) as session:
            statement = select(Endpoint).where(Endpoint.uuid == endpoint_uuid)
            return session.exec(statement).first()

    # Folder management methods
    async def create_folder(
        self,
        name: str,
        description: str = None,
        parent_uuid: str = None,
    ) -> Folder:
        """Create a new folder"""
        with Session(engine) as session:
            folder = Folder(
                uuid=str(uuid_lib.uuid4()),
                name=name,
                description=description,
                parent_uuid=parent_uuid,
            )
            session.add(folder)
            session.commit()
            session.refresh(folder)
            return folder

    async def update_folder(self, folder_uuid: str, **kwargs) -> Optional[Folder]:
        """Update a folder by UUID"""
        with Session(engine) as session:
            statement = select(Folder).where(Folder.uuid == folder_uuid)
            folder = session.exec(statement).first()
            if folder:
                for key, value in kwargs.items():
                    if hasattr(folder, key) and value is not None:
                        setattr(folder, key, value)
                session.add(folder)
                session.commit()
                session.refresh(folder)
            return folder

    async def delete_folder(self, folder_uuid: str) -> bool:
        """Delete a folder by UUID"""
        with Session(engine) as session:
            statement = select(Folder).where(Folder.uuid == folder_uuid)
            folder = session.exec(statement).first()
            if folder:
                session.delete(folder)
                session.commit()
                return True
            return False

    # Endpoint management methods
    async def create_endpoint(
        self,
        name: str,
        method: str,
        url: str,
        description: str = None,
        parent_uuid: str = None,
        cases: List[dict] = None,
    ) -> Endpoint:
        """Create a new endpoint"""
        with Session(engine) as session:
            endpoint = Endpoint(
                uuid=str(uuid_lib.uuid4()),
                name=name,
                description=description,
                method=method.upper(),
                url=url,
                parent_uuid=parent_uuid,
                cases=cases or [],
            )
            session.add(endpoint)
            session.commit()
            session.refresh(endpoint)
            return endpoint

    async def update_endpoint(self, endpoint_uuid: str, **kwargs) -> Optional[Endpoint]:
        """Update an endpoint by UUID"""
        with Session(engine) as session:
            statement = select(Endpoint).where(Endpoint.uuid == endpoint_uuid)
            endpoint = session.exec(statement).first()
            if endpoint:
                for key, value in kwargs.items():
                    if hasattr(endpoint, key) and value is not None:
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
            if endpoint:
                session.delete(endpoint)
                session.commit()
                return True
            return False

    async def find_items_by_parent_uuid(
        self, parent_uuid: str
    ) -> List[Union[Folder, Endpoint]]:
        """Find all items (folders and endpoints) with the given parent UUID"""
        with Session(engine) as session:
            # Get folders with this parent_uuid
            folders = session.exec(
                select(Folder).where(Folder.parent_uuid == parent_uuid)
            ).all()
            # Get endpoints with this parent_uuid
            endpoints = session.exec(
                select(Endpoint).where(Endpoint.parent_uuid == parent_uuid)
            ).all()

            # Combine and return
            items = []
            for folder in folders:
                items.append(folder)
            for endpoint in endpoints:
                items.append(endpoint)

            return items

    async def find_items_by_collection_uuid(
        self, collection_uuid: str
    ) -> List[Union[Folder, Endpoint]]:
        """Find all items (folders and endpoints) in a specific collection"""
        return await self.find_items_by_parent_uuid(collection_uuid)


# Global service instance
endpoint_service = EndpointManagementService()
