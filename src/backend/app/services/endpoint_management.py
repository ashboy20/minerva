from typing import List, Optional, Union
from app.models.endpoint_management import Collection, Folder, Endpoint
from app.db.connection import Session, engine
from sqlmodel import select
import uuid as uuid_lib
from datetime import datetime, UTC


class EndpointManagementService:
    """Service for managing endpoints and folders"""

    # Collection methods
    async def get_collections(self) -> List[Collection]:
        """Get all collections"""
        with Session(engine) as session:
            statement = select(Collection)
            collections = session.exec(statement).all()
            return collections

    async def create_blank_collection(self) -> bool:
        """Create a blank collection"""
        try:
            with Session(engine) as session:
                collection = Collection(
                    uuid=str(uuid_lib.uuid4()),
                    name="New Collection",
                    description="",
                    variables=[],
                    position=len(session.exec(select(Collection)).all()) + 1,
                )
                session.add(collection)
                session.commit()
                return True
        except Exception as e:
            print(e)
            raise e

    async def _get_type_by_uuid(self, uuid: str) -> str:
        """Get the type of an item by UUID"""
        with Session(engine) as session:
            statement = select(Collection).where(Collection.uuid == uuid)
            collection = session.exec(statement).first()
            if collection:
                return "collection"
            statement = select(Folder).where(Folder.uuid == uuid)
            folder = session.exec(statement).first()
            if folder:
                return "folder"
            statement = select(Endpoint).where(Endpoint.uuid == uuid)
            endpoint = session.exec(statement).first()
            if endpoint:
                return "endpoint"
            return None

    async def _update_position(
        self,
        dragged_uuid: str,
        items: List[Union[Collection, Folder, Endpoint]],
        relative_index: int,
    ) -> List[Union[Collection, Folder, Endpoint]]:
        """Update positions of items after reordering

        Args:
            dragged_uuid: UUID of the item being moved
            items: List of items to reorder
            relative_index: New position index for the dragged item (0-based for first position, 1-based for others)

        Returns:
            Updated list of items with new positions
        """
        # Find the dragged item
        dragged_item = None
        for item in items:
            if item.uuid == dragged_uuid:
                dragged_item = item
                break

        if not dragged_item:
            raise ValueError(f"Dragged item not found for UUID: {dragged_uuid}")

        # Remove dragged item from current position
        items.remove(dragged_item)

        # Convert relative_index to 0-based for list operations
        # If relative_index is 0, keep it as 0
        # For all other positions, subtract 1 to convert from 1-based to 0-based
        insert_index = 0 if relative_index == 0 else relative_index - 1

        # Insert at new position
        items.insert(insert_index, dragged_item)

        # Update all positions and timestamps
        # Always use 1-based positions in the database
        current_time = datetime.now(UTC)
        for i, item in enumerate(items):
            item.position = i + 1  # Always 1-based in database
            item.updated_at = current_time

        return items

    async def reorder_items(
        self,
        dragged_uuid: str,
        old_parent_uuid: Optional[Union[str, int]],
        new_parent_uuid: Optional[str],
        relative_index: int,
    ) -> bool:
        """Reorder items by UUIDs

        Args:
            dragged_uuid: UUID of the item being moved
            old_parent_uuid: Current parent UUID
            new_parent_uuid: New parent UUID (can be same as old_parent_uuid for reordering)
            relative_index: New position index for the dragged item (0-based for first position, 1-based for others)

        Returns:
            True if reordering was successful
        """
        item_type = await self._get_type_by_uuid(dragged_uuid)
        if not item_type:
            raise ValueError(f"Item not found for UUID: {dragged_uuid}")

        with Session(engine) as session:
            # Collection reordering (collections are at root level)
            if item_type == "collection":
                collections = session.exec(
                    select(Collection).order_by(Collection.position)
                ).all()
                collections = await self._update_position(
                    dragged_uuid, collections, relative_index
                )
                for collection in collections:
                    session.add(collection)
                session.commit()
                return True

            # Get the item being moved
            dragged_item = None
            if item_type == "folder":
                dragged_item = session.exec(
                    select(Folder).where(Folder.uuid == dragged_uuid)
                ).first()
            else:  # endpoint
                dragged_item = session.exec(
                    select(Endpoint).where(Endpoint.uuid == dragged_uuid)
                ).first()

            if not dragged_item:
                raise ValueError(f"Item not found for UUID: {dragged_uuid}")

            # Reordering within same parent
            if old_parent_uuid == new_parent_uuid:
                items = await self.find_items_by_parent_uuid(old_parent_uuid, session)
                items = await self._update_position(dragged_uuid, items, relative_index)
                for item in items:
                    session.add(item)
                session.commit()
                return True

            # Moving to different parent
            else:
                # Update old parent's items
                old_parent_items = await self.find_items_by_parent_uuid(
                    old_parent_uuid, session
                )
                old_parent_items.remove(dragged_item)
                current_time = datetime.now(UTC)
                for i, item in enumerate(old_parent_items):
                    item.position = i + 1  # Always 1-based in database
                    item.updated_at = current_time
                    session.add(item)

                # Update new parent's items
                new_parent_items = await self.find_items_by_parent_uuid(
                    new_parent_uuid, session
                )
                dragged_item.parent_uuid = new_parent_uuid
                dragged_item.updated_at = current_time

                # Convert relative_index to 0-based for list operations
                insert_index = 0 if relative_index == 0 else relative_index - 1
                new_parent_items.insert(insert_index, dragged_item)

                for i, item in enumerate(new_parent_items):
                    item.position = i + 1  # Always 1-based in database
                    item.updated_at = current_time
                    session.add(item)

                session.commit()
                return True

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

    async def update_item(self, uuid: str, items: dict) -> Union[Collection, Folder, Endpoint, None]:
        """Update an item by UUID. Works for collections, folders, and endpoints.

        Args:
            uuid: The UUID of the item to update
            items: Dictionary of fields to update

        Returns:
            The updated item or None if not found
        """
        item_type = await self._get_type_by_uuid(uuid)
        if not item_type:
            return None

        with Session(engine) as session:
            # Get the item based on its type
            if item_type == "collection":
                statement = select(Collection).where(Collection.uuid == uuid)
                item = session.exec(statement).first()
            elif item_type == "folder":
                statement = select(Folder).where(Folder.uuid == uuid)
                item = session.exec(statement).first()
            else:  # endpoint
                statement = select(Endpoint).where(Endpoint.uuid == uuid)
                item = session.exec(statement).first()

            if item:
                # Update fields
                for key, value in items.items():
                    if hasattr(item, key) and value is not None:
                        setattr(item, key, value)
                session.add(item)
                session.commit()
                session.refresh(item)
                return item
            return None

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
        self, parent_uuid: str, session: Optional[Session] = None
    ) -> List[Union[Folder, Endpoint]]:
        """Find all items (folders and endpoints) with the given parent UUID"""
        should_close_session = False
        if session is None:
            session = Session(engine)
            should_close_session = True

        try:
            # Get folders with this parent_uuid
            folders = session.exec(
                select(Folder)
                .where(Folder.parent_uuid == parent_uuid)
                .order_by(Folder.position)
            ).all()
            # Get endpoints with this parent_uuid
            endpoints = session.exec(
                select(Endpoint)
                .where(Endpoint.parent_uuid == parent_uuid)
                .order_by(Endpoint.position)
            ).all()

            # Combine and return
            items = []
            for folder in folders:
                items.append(folder)
            for endpoint in endpoints:
                items.append(endpoint)
            sorted_items = sorted(items, key=lambda x: x.position)
            return sorted_items
        finally:
            if should_close_session:
                session.close()

    async def find_items_by_collection_uuid(
        self, collection_uuid: str
    ) -> List[Union[Folder, Endpoint]]:
        """Find all items (folders and endpoints) in a specific collection"""
        return await self.find_items_by_parent_uuid(collection_uuid)

    async def rename_collection(self, uuid: str, new_name: str) -> bool:
        """Rename a collection by UUID"""
        with Session(engine) as session:
            collection = session.get(Collection, uuid)
            if not collection:
                return False

            collection.name = new_name
            session.commit()
            return True

    async def rename_folder(self, uuid: str, new_name: str) -> bool:
        """Rename a folder by UUID"""
        with Session(engine) as session:
            folder = session.get(Folder, uuid)
            if not folder:
                return False

            folder.name = new_name
            session.commit()
            return True

    async def rename_endpoint(self, uuid: str, new_name: str) -> bool:
        """Rename an endpoint by UUID"""
        with Session(engine) as session:
            endpoint = session.get(Endpoint, uuid)
            if not endpoint:
                return False

            endpoint.name = new_name
            session.commit()
            return True


# Global service instance
endpoint_service = EndpointManagementService()