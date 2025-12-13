import uuid
import re
import yaml
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.models.collections import CollectionItem, FolderItem, EndpointItem


class CollectionsService:
    """Service for managing file-based collections"""

    def __init__(self, collections_dir: str = "app/db/data/collections"):
        """Initialize collections service

        Args:
            collections_dir: Path to the collections directory
        """
        self.collections_dir = Path(collections_dir)
        self.meta_file = self.collections_dir / "meta.yaml"

    def _generate_slug(self, name: str) -> str:
        """Generate a slug from a display name

        Args:
            name: Display name to convert to slug

        Returns:
            Slug (lowercase, hyphens instead of spaces/special chars)

        Raises:
            ValueError: If name is empty or contains no alphanumeric characters
        """
        if not name or not name.strip():
            raise ValueError("Name cannot be empty")

        # Generate slug from name (lowercase, replace spaces/special chars with hyphens)
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower().strip())
        slug = re.sub(r"-+", "-", slug)  # Replace multiple hyphens with single
        slug = slug.strip("-")  # Remove leading/trailing hyphens

        if not slug:
            raise ValueError("Name must contain at least one alphanumeric character")

        return slug

    def _read_yaml_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Read and parse a YAML file

        Args:
            file_path: Path to the YAML file

        Returns:
            Parsed YAML content or None if error
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return None

    def _write_yaml_file(self, file_path: Path, data: Dict[str, Any]) -> bool:
        """Write data to a YAML file

        Args:
            file_path: Path to the YAML file
            data: Data to write

        Returns:
            True if successful, False otherwise
        """
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(
                    data,
                    f,
                    default_flow_style=False,
                    allow_unicode=True,
                    sort_keys=False,
                    indent=2,  # Use 2-space indentation
                    width=120,  # Prevent line wrapping too early
                )
            return True
        except Exception as e:
            print(f"Error writing {file_path}: {e}")
            return False

    def _read_global_meta(self) -> Optional[Dict[str, Any]]:
        """Read the global meta.yaml file

        Returns:
            Global meta data or None if error
        """
        if not self.meta_file.exists():
            return None
        return self._read_yaml_file(self.meta_file)

    def _read_item_meta(self, item_path: Path) -> Optional[Dict[str, Any]]:
        """Read meta.yaml from a collection or folder directory

        Args:
            item_path: Path to the directory

        Returns:
            Meta data or None if error
        """
        meta_file = item_path / "meta.yaml"
        if not meta_file.exists():
            return None
        return self._read_yaml_file(meta_file)

    def _process_endpoint_item(
        self, endpoint_meta: Dict[str, Any], parent_path: Path
    ) -> EndpointItem:
        """Process endpoint metadata and create EndpointItem

        Args:
            endpoint_meta: Endpoint metadata from global meta.yaml
            parent_path: Path to parent folder

        Returns:
            EndpointItem

        Raises:
            ValueError: If endpoint data is invalid or missing
        """
        endpoint_uuid = endpoint_meta.get("uuid")
        endpoint_name = endpoint_meta.get("name")
        seq = endpoint_meta.get("seq", 0)

        if not endpoint_uuid:
            raise ValueError(f"Endpoint UUID missing in meta: {endpoint_meta}")
        if not endpoint_name:
            raise ValueError(f"Endpoint name (slug) missing in meta: {endpoint_meta}")

        # Construct endpoint file path
        endpoint_file = parent_path / f"{endpoint_name}.yaml"
        if not endpoint_file.exists():
            raise FileNotFoundError(
                f"Endpoint file not found: {endpoint_file.resolve()}"
            )

        # Read endpoint file to get display name and method
        endpoint_data = self._read_yaml_file(endpoint_file)
        if not endpoint_data:
            raise ValueError(f"Failed to parse endpoint file: {endpoint_file}")

        display_name = endpoint_data.get("name")
        if not display_name:
            raise ValueError(f"Endpoint name missing in file: {endpoint_file}")

        return EndpointItem(
            uuid=endpoint_uuid,
            name=display_name,
            seq=seq,
            method=endpoint_data.get("method", "GET"),
        )

    def _process_folder_item(
        self, folder_meta: Dict[str, Any], parent_path: Path
    ) -> FolderItem:
        """Process folder metadata and create FolderItem

        Args:
            folder_meta: Folder metadata from global meta.yaml
            parent_path: Path to parent collection

        Returns:
            FolderItem

        Raises:
            ValueError: If folder data is invalid or missing
            FileNotFoundError: If folder directory doesn't exist
        """
        folder_uuid = folder_meta.get("uuid")
        folder_name = folder_meta.get("name")
        seq = folder_meta.get("seq", 0)
        is_opened = folder_meta.get("is_opened", False)
        folder_items = folder_meta.get("items", [])

        if not folder_uuid:
            raise ValueError(f"Folder UUID missing in meta: {folder_meta}")
        if not folder_name:
            raise ValueError(f"Folder name (slug) missing in meta: {folder_meta}")

        # Construct folder path
        folder_path = parent_path / folder_name
        if not folder_path.exists():
            raise FileNotFoundError(
                f"Folder directory not found: {folder_path.resolve()}"
            )

        # Read folder meta.yaml to get display name
        folder_data = self._read_item_meta(folder_path)
        if not folder_data:
            raise ValueError(
                f"Failed to parse folder meta.yaml: {folder_path / 'meta.yaml'}"
            )

        display_name = folder_data.get("name")
        if not display_name:
            raise ValueError(
                f"Folder name missing in meta.yaml: {folder_path / 'meta.yaml'}"
            )

        folder_item = FolderItem(
            uuid=folder_uuid,
            name=display_name,
            seq=seq,
            is_opened=is_opened,
            items=[],
        )

        # Process items in folder
        items = []
        for item_meta in folder_items:
            item_type = item_meta.get("type")
            if item_type == "endpoint":
                endpoint = self._process_endpoint_item(item_meta, folder_path)
                items.append(endpoint)
            elif item_type == "folder":
                # Support nested folders if needed
                subfolder = self._process_folder_item(item_meta, folder_path)
                items.append(subfolder)
            else:
                raise ValueError(
                    f"Unknown item type '{item_type}' in folder {display_name}"
                )

        # Sort by seq
        folder_item.items = sorted(items, key=lambda x: x.seq)

        return folder_item

    def _process_collection_item(
        self, collection_meta: Dict[str, Any]
    ) -> CollectionItem:
        """Process collection metadata and create CollectionItem

        Args:
            collection_meta: Collection metadata from global meta.yaml

        Returns:
            CollectionItem

        Raises:
            ValueError: If collection data is invalid or missing
            FileNotFoundError: If collection directory doesn't exist
        """
        collection_uuid = collection_meta.get("uuid")
        collection_name = collection_meta.get("name")
        seq = collection_meta.get("seq", 0)
        is_opened = collection_meta.get("is_opened", False)
        collection_items = collection_meta.get("items", [])

        if not collection_uuid:
            raise ValueError(f"Collection UUID missing in meta: {collection_meta}")
        if not collection_name:
            raise ValueError(
                f"Collection name (slug) missing in meta: {collection_meta}"
            )

        # Construct collection path
        collection_path = self.collections_dir / collection_name
        if not collection_path.exists():
            raise FileNotFoundError(
                f"Collection directory not found: {collection_path.resolve()}"
            )

        # Read collection meta.yaml to get display name
        collection_data = self._read_item_meta(collection_path)
        if not collection_data:
            raise ValueError(
                f"Failed to parse collection meta.yaml: {collection_path / 'meta.yaml'}"
            )

        display_name = collection_data.get("name")
        if not display_name:
            raise ValueError(
                f"Collection name missing in meta.yaml: {collection_path / 'meta.yaml'}"
            )

        collection = CollectionItem(
            uuid=collection_uuid,
            name=display_name,
            seq=seq,
            is_opened=is_opened,
            items=[],
        )

        # Process items in collection
        items = []
        for item_meta in collection_items:
            item_type = item_meta.get("type")
            if item_type == "folder":
                folder = self._process_folder_item(item_meta, collection_path)
                items.append(folder)
            elif item_type == "endpoint":
                endpoint = self._process_endpoint_item(item_meta, collection_path)
                items.append(endpoint)
            else:
                raise ValueError(
                    f"Unknown item type '{item_type}' in collection {display_name}"
                )

        # Sort by seq
        collection.items = sorted(items, key=lambda x: x.seq)

        return collection

    def get_collections_list(self) -> List[CollectionItem]:
        """Read global meta.yaml and return collection tree

        Returns:
            List of CollectionItem with nested folders and endpoints

        Raises:
            FileNotFoundError: If global meta file cannot be found
            Exception: If global meta file cannot be read or parsed
        """
        # Check if meta file exists
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        # Read global meta file
        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        collections = []
        collections_data = global_meta.get("collections", [])

        # Process each collection
        for collection_meta in collections_data:
            collection = self._process_collection_item(collection_meta)
            collections.append(collection)

        # Sort by seq
        collections.sort(key=lambda x: x.seq)

        return collections

    def reorder_item(
        self,
        item_uuid: str,
        destination_folder_uuid: Optional[str],
        destination_seq: int,
    ) -> Dict[str, Any]:
        """Reorder an item by updating sequence numbers in meta.yaml

        Args:
            item_uuid: UUID of the item to move (collection/folder/endpoint)
            destination_folder_uuid: UUID of destination folder/collection (None for root)
            destination_seq: Target sequence number in destination

        Returns:
            Result with updated meta information

        Raises:
            FileNotFoundError: If global meta file not found
            ValueError: If item or destination not found
            Exception: If operation fails
        """
        # Read global meta
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find the item and its current parent
        item_data, old_parent_uuid, old_seq = self._find_and_remove_item(
            global_meta, item_uuid
        )
        if not item_data:
            raise ValueError(f"Item not found: {item_uuid}")

        # Check if parent changed
        parent_changed = old_parent_uuid != destination_folder_uuid

        # Reindex old parent items (after removal) if parent changed
        if parent_changed:
            if old_parent_uuid is None:
                old_parent_items = global_meta.get("collections", [])
            else:
                old_parent = self._find_item_by_uuid(global_meta, old_parent_uuid)
                if old_parent:
                    old_parent_items = old_parent.get("items", [])
                else:
                    old_parent_items = []

            if old_parent_items:
                self._reindex_items(old_parent_items)

        # Find destination parent and insert item
        if destination_folder_uuid is None:
            # Moving to root (collections level)
            destination_items = global_meta.get("collections", [])
        else:
            destination_parent = self._find_item_by_uuid(
                global_meta, destination_folder_uuid
            )
            if not destination_parent:
                raise ValueError(f"Destination not found: {destination_folder_uuid}")
            destination_items = destination_parent.get("items", [])

        # Insert item at target position and reindex
        self._reindex_items_with_insert(destination_items, item_data, destination_seq)

        # Write updated global meta
        if not self._write_yaml_file(self.meta_file, global_meta):
            raise Exception("Failed to write global meta file")

        # Move physical files if parent changed
        if parent_changed:
            self._move_physical_item(
                global_meta, item_data, old_parent_uuid, destination_folder_uuid
            )

        return {
            "message": "Item reordered successfully",
            "item_uuid": item_uuid,
            "new_seq": destination_seq,
            "parent_changed": parent_changed,
        }

    def _reindex_items(self, items: List[Dict[str, Any]]):
        """Sort items by seq and reindex to ensure sequential ordering

        This function is used when just cleaning up seq values without inserting a new item.
        Sorts items by their current seq value and reassigns sequential values.

        Args:
            items: List of items to reindex (modified in place)
        """
        # Sort by current seq value (stable sort maintains relative order for equal values)
        items.sort(key=lambda x: x.get("seq", 0))

        # Reassign seq values sequentially to remove gaps and conflicts
        for idx, item in enumerate(items):
            item["seq"] = idx

    def _reindex_items_with_insert(
        self, items: List[Dict[str, Any]], new_item: Dict[str, Any], target_seq: int
    ):
        """Insert an item at target_seq and reindex all items

        This function properly handles inserting an item at a specific position,
        shifting other items as needed.

        Logic:
        1. Sort existing items by their current seq
        2. Reindex them sequentially (0, 1, 2, ...)
        3. Insert new_item at the target_seq position
        4. Shift items at target_seq and after

        Example - Insert D at seq:1 into [A(seq:0), B(seq:2)]:
            After sort/reindex: [A(seq:0), B(seq:1)]
            Insert D at 1: [A(seq:0), D(seq:1), B(seq:2)]

        Args:
            items: Existing items list (will be modified in place)
            new_item: Item to insert
            target_seq: Target sequence position for new_item
        """
        # First, sort existing items and reindex them sequentially
        items.sort(key=lambda x: x.get("seq", 0))
        for idx, item in enumerate(items):
            item["seq"] = idx

        # Now insert the new item at the target position
        # If target_seq is beyond the list, insert at the end
        insert_pos = min(target_seq, len(items))
        items.insert(insert_pos, new_item)

        # Final reindex to ensure sequential seq values
        for idx, item in enumerate(items):
            item["seq"] = idx

    def _find_item_by_uuid(
        self, meta_data: Dict[str, Any], uuid: str
    ) -> Optional[Dict[str, Any]]:
        """Recursively find an item by UUID

        Args:
            meta_data: Global meta data or sub-item
            uuid: UUID to find

        Returns:
            Item dict or None
        """
        # Check collections
        for collection in meta_data.get("collections", []):
            if collection.get("uuid") == uuid:
                return collection
            # Check items in collection
            result = self._find_in_items(collection.get("items", []), uuid)
            if result:
                return result
        return None

    def _find_in_items(
        self, items: List[Dict[str, Any]], uuid: str
    ) -> Optional[Dict[str, Any]]:
        """Recursively search in items list

        Args:
            items: List of items to search
            uuid: UUID to find

        Returns:
            Item dict or None
        """
        for item in items:
            if item.get("uuid") == uuid:
                return item
            # If it's a folder, search its items
            if item.get("type") == "folder" and "items" in item:
                result = self._find_in_items(item["items"], uuid)
                if result:
                    return result
        return None

    def _find_parent_uuid(
        self, meta_data: Dict[str, Any], target_uuid: str
    ) -> Optional[str]:
        """Find the parent UUID of an item

        Args:
            meta_data: Global meta data
            target_uuid: UUID of the item to find parent for

        Returns:
            Parent UUID or None if item is at root level or not found
        """
        # Check if item is a collection (root level)
        collections = meta_data.get("collections", [])
        for collection in collections:
            if collection.get("uuid") == target_uuid:
                return None  # Collections have no parent

        # Search in collection items
        for collection in collections:
            result = self._find_parent_in_items(
                collection.get("items", []), target_uuid, collection.get("uuid")
            )
            if result is not False:  # Use False to distinguish from None (root parent)
                return result

        return None  # Not found

    def _find_parent_in_items(
        self, items: List[Dict[str, Any]], target_uuid: str, parent_uuid: str
    ) -> Optional[str] | bool:
        """Recursively find parent UUID in items

        Args:
            items: List of items to search
            target_uuid: UUID to find
            parent_uuid: Current parent UUID

        Returns:
            Parent UUID, None (if found at this level), or False (if not found)
        """
        for item in items:
            if item.get("uuid") == target_uuid:
                return parent_uuid

            # If it's a folder, search its items
            if item.get("type") == "folder" and "items" in item:
                result = self._find_parent_in_items(
                    item["items"], target_uuid, item.get("uuid")
                )
                if result is not False:
                    return result

        return False  # Not found in this branch

    def _find_and_remove_item(
        self, meta_data: Dict[str, Any], uuid: str
    ) -> tuple[Optional[Dict[str, Any]], Optional[str], Optional[int]]:
        """Find and remove an item from meta data

        Args:
            meta_data: Global meta data
            uuid: UUID to find and remove

        Returns:
            Tuple of (item_data, parent_uuid, old_index)
        """
        # Check in collections (root level)
        collections = meta_data.get("collections", [])
        for idx, collection in enumerate(collections):
            if collection.get("uuid") == uuid:
                removed = collections.pop(idx)
                return removed, None, idx

        # Check in collection items
        for collection in collections:
            result = self._remove_from_items(
                collection.get("items", []), uuid, collection.get("uuid")
            )
            if result[0]:
                return result

        return None, None, None

    def _remove_from_items(
        self, items: List[Dict[str, Any]], uuid: str, parent_uuid: str
    ) -> tuple[Optional[Dict[str, Any]], Optional[str], Optional[int]]:
        """Recursively remove item from items list

        Args:
            items: List to search
            uuid: UUID to remove
            parent_uuid: UUID of parent

        Returns:
            Tuple of (item_data, parent_uuid, old_index)
        """
        for idx, item in enumerate(items):
            if item.get("uuid") == uuid:
                removed = items.pop(idx)
                return removed, parent_uuid, idx
            # If it's a folder, search its items
            if item.get("type") == "folder" and "items" in item:
                result = self._remove_from_items(item["items"], uuid, item.get("uuid"))
                if result[0]:
                    return result
        return None, None, None

    def _move_physical_item(
        self,
        global_meta: Dict[str, Any],
        item_data: Dict[str, Any],
        old_parent_uuid: Optional[str],
        new_parent_uuid: Optional[str],
    ):
        """Move physical files/folders if parent changed

        Args:
            global_meta: Global meta data to traverse for path building
            item_data: Item metadata with name and type
            old_parent_uuid: Old parent UUID (None for root)
            new_parent_uuid: New parent UUID (None for root)
        """
        # If parent didn't change, no need to move files
        if old_parent_uuid == new_parent_uuid:
            return

        item_type = item_data.get("type")
        item_name = item_data.get("name")

        if not item_name:
            raise ValueError(f"Item name missing in item_data: {item_data}")

        # Build old path
        old_path = self._build_path_from_uuid(global_meta, old_parent_uuid)
        if item_type == "endpoint":
            old_file_path = old_path / f"{item_name}.yaml"
        else:  # folder
            old_file_path = old_path / item_name

        # Build new path
        new_path = self._build_path_from_uuid(global_meta, new_parent_uuid)
        if item_type == "endpoint":
            new_file_path = new_path / f"{item_name}.yaml"
        else:  # folder
            new_file_path = new_path / item_name

        # Move the file/folder using pathlib
        if not old_file_path.exists():
            raise FileNotFoundError(f"Source path not found: {old_file_path.resolve()}")

        # Ensure destination directory exists
        new_path.mkdir(parents=True, exist_ok=True)

        # Move the file/folder using pathlib's rename (works across same filesystem)
        old_file_path.rename(new_file_path)

    def _build_path_from_uuid(
        self, global_meta: Dict[str, Any], parent_uuid: Optional[str]
    ) -> Path:
        """Build filesystem path by traversing global meta structure

        Args:
            global_meta: Global meta data
            parent_uuid: UUID of parent (None for root/collections dir)

        Returns:
            Path object representing the directory path
        """
        # Root level (collections directory)
        if parent_uuid is None:
            return self.collections_dir

        # Find the path by traversing from root to the target UUID
        path_parts = self._find_path_to_uuid(global_meta, parent_uuid)

        if path_parts is None:
            raise ValueError(f"Parent UUID not found: {parent_uuid}")

        # Build the full path
        full_path = self.collections_dir
        for part in path_parts:
            full_path = full_path / part

        return full_path

    def _find_path_to_uuid(
        self, global_meta: Dict[str, Any], target_uuid: str
    ) -> Optional[List[str]]:
        """Find the path components to reach a UUID in the meta structure

        Args:
            global_meta: Global meta data
            target_uuid: UUID to find

        Returns:
            List of path components (folder/collection names) or None if not found
        """
        # Check collections
        for collection in global_meta.get("collections", []):
            if collection.get("uuid") == target_uuid:
                # Found at collection level
                return [collection.get("name")]

            # Check within collection items
            result = self._find_path_in_items(
                collection.get("items", []), target_uuid, [collection.get("name")]
            )
            if result:
                return result

        return None

    def _find_path_in_items(
        self, items: List[Dict[str, Any]], target_uuid: str, current_path: List[str]
    ) -> Optional[List[str]]:
        """Recursively search for UUID in items and build path

        Args:
            items: List of items to search
            target_uuid: UUID to find
            current_path: Current path components

        Returns:
            List of path components or None if not found
        """
        for item in items:
            if item.get("uuid") == target_uuid:
                # Found it - return current path plus this item's name
                if item.get("type") == "folder":
                    return current_path + [item.get("name")]
                else:
                    # For endpoints, just return the current path (parent folder)
                    return current_path

            # If it's a folder, search recursively
            if item.get("type") == "folder" and "items" in item:
                result = self._find_path_in_items(
                    item["items"], target_uuid, current_path + [item.get("name")]
                )
                if result:
                    return result

        return None

    def toggle_open_state(self, uuid: str, is_opened: bool) -> Dict[str, Any]:
        """Toggle the open state of a collection or folder

        Args:
            uuid: UUID of the collection or folder
            is_opened: New open state (True = opened, False = closed)

        Returns:
            Dictionary with operation result

        Raises:
            FileNotFoundError: If global meta file not found
            ValueError: If item with UUID not found
            Exception: If operation fails
        """
        # Read global meta
        global_meta = self._read_global_meta()
        if not global_meta:
            raise FileNotFoundError(f"Global meta file not found: {self.meta_file}")

        # Find and update the item
        updated = self._update_is_opened_recursive(
            global_meta.get("collections", []), uuid, is_opened
        )

        if not updated:
            raise ValueError(f"Item with UUID '{uuid}' not found")

        # Write updated meta back to file
        if not self._write_yaml_file(self.meta_file, global_meta):
            raise Exception(f"Failed to write global meta file: {self.meta_file}")

        return {
            "message": "Open state updated successfully",
            "uuid": uuid,
            "is_opened": is_opened,
        }

    def _update_is_opened_recursive(
        self, items: List[Dict[str, Any]], target_uuid: str, is_opened: bool
    ) -> bool:
        """Recursively find and update is_opened field

        Args:
            items: List of items (collections/folders/endpoints)
            target_uuid: UUID to find and update
            is_opened: New open state

        Returns:
            True if item was found and updated, False otherwise
        """
        for item in items:
            # Check if this is the target item
            if item.get("uuid") == target_uuid:
                # Get item type - collections at root don't have 'type' field
                item_type = item.get("type")

                # Endpoints don't have is_opened field
                if item_type == "endpoint":
                    return False

                # Collections (no type at root) and folders have is_opened
                item["is_opened"] = is_opened
                return True

            # If it has items, search recursively
            if "items" in item and isinstance(item["items"], list):
                if self._update_is_opened_recursive(
                    item["items"], target_uuid, is_opened
                ):
                    return True

        return False

    def create_collection(self, name: str) -> Dict[str, Any]:
        """Create a new collection with a directory and meta.yaml file

        Args:
            name: Display name for the collection

        Returns:
            Dictionary with creation result including UUID, name, and slug

        Raises:
            ValueError: If name is empty or collection already exists
            Exception: If operation fails
        """
        # Generate UUID and slug for the collection
        collection_uuid = str(uuid.uuid4())
        slug = self._generate_slug(name)

        # Check if collection with this slug already exists
        collection_dir = self.collections_dir / slug
        if collection_dir.exists():
            raise ValueError(f"Collection name '{slug}' already exists")

        # Read global meta
        if not self.meta_file.exists():
            # Initialize empty meta if file doesn't exist
            global_meta = {"collections": []}
        else:
            global_meta = self._read_global_meta()
            if not global_meta:
                raise Exception(
                    f"Failed to parse global meta file: {self.meta_file.resolve()}"
                )

        # Calculate sequence number (append to end)
        collections = global_meta.get("collections", [])
        seq = len(collections)

        # Create collection directory
        collection_dir.mkdir(parents=True, exist_ok=True)

        # Create collection meta.yaml
        collection_meta = {
            "name": name,
        }
        collection_meta_file = collection_dir / "meta.yaml"
        if not self._write_yaml_file(collection_meta_file, collection_meta):
            raise Exception(
                f"Failed to write collection meta file: {collection_meta_file}"
            )

        # Add collection to global meta
        new_collection = {
            "uuid": collection_uuid,
            "name": slug,
            "seq": seq,
            "is_opened": False,
            "items": [],
        }
        collections.append(new_collection)
        global_meta["collections"] = collections

        # Write updated global meta
        if not self._write_yaml_file(self.meta_file, global_meta):
            # Rollback: remove created directory
            if collection_dir.exists():
                self._delete_directory(collection_dir)
            raise Exception("Failed to write global meta file")

        return {
            "message": "Collection created successfully",
            "uuid": collection_uuid,
            "name": name,
            "slug": slug,
        }

    def delete_collection(self, uuid: str) -> Dict[str, Any]:
        """Delete a collection by UUID

        Args:
            uuid: UUID of the collection to delete

        Returns:
            Dictionary with deletion result including UUID and slug

        Raises:
            ValueError: If collection not found
            Exception: If operation fails
        """
        # Read global meta
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find the collection
        collections = global_meta.get("collections", [])
        collection_to_delete = None
        collection_index = None

        for idx, collection in enumerate(collections):
            if collection.get("uuid") == uuid:
                collection_to_delete = collection
                collection_index = idx
                break

        if not collection_to_delete:
            raise ValueError(f"Collection with UUID '{uuid}' not found")

        # Get collection slug (directory name)
        slug = collection_to_delete.get("name")
        if not slug:
            raise ValueError(f"Collection slug missing in meta: {collection_to_delete}")

        # Build collection directory path
        collection_dir = self.collections_dir / slug

        # Remove from global meta
        collections.pop(collection_index)

        # Reindex remaining collections
        self._reindex_items(collections)

        # Write updated global meta
        if not self._write_yaml_file(self.meta_file, global_meta):
            raise Exception("Failed to write global meta file")

        # Delete the collection directory using Path methods
        if collection_dir.exists():
            try:
                self._delete_directory(collection_dir)
            except Exception as e:
                # If directory deletion fails, the meta is already updated
                # Log the error but don't fail the operation
                print(
                    f"Warning: Failed to delete collection directory {collection_dir}: {e}"
                )

        return {
            "message": "Collection deleted successfully",
            "uuid": uuid,
            "slug": slug,
        }

    def _delete_directory(self, path: Path):
        """Recursively delete a directory using Path methods

        Args:
            path: Path to the directory to delete
        """
        if not path.exists():
            return

        if path.is_file():
            path.unlink()
        elif path.is_dir():
            for child in path.iterdir():
                self._delete_directory(child)
            path.rmdir()

    def create_folder(self, name: str, parent_uuid: str) -> Dict[str, Any]:
        """Create a new folder within a collection or folder

        Args:
            name: Display name for the folder
            parent_uuid: UUID of the parent collection or folder

        Returns:
            Dictionary with creation result including UUID, name, and slug

        Raises:
            ValueError: If name is empty, parent not found, or folder already exists
            Exception: If operation fails
        """
        # Generate UUID and slug for the folder
        folder_uuid = str(uuid.uuid4())
        slug = self._generate_slug(name)

        # Read global meta
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find the parent (collection or folder)
        parent_item = self._find_item_by_uuid(global_meta, parent_uuid)
        if not parent_item:
            raise ValueError(f"Parent with UUID '{parent_uuid}' not found")

        # Build parent path
        parent_path = self._build_path_from_uuid(global_meta, parent_uuid)

        # Check if folder with this slug already exists
        folder_dir = parent_path / slug
        if folder_dir.exists():
            raise ValueError(f"Folder name '{slug}' already exists in this location")

        # Create folder directory
        folder_dir.mkdir(parents=True, exist_ok=True)

        # Create folder meta.yaml
        folder_meta = {
            "name": name,
        }
        folder_meta_file = folder_dir / "meta.yaml"
        if not self._write_yaml_file(folder_meta_file, folder_meta):
            raise Exception(f"Failed to write folder meta file: {folder_meta_file}")

        # Add folder to parent's items list
        parent_items = parent_item.get("items", [])
        seq = len(parent_items)

        new_folder = {
            "type": "folder",
            "uuid": folder_uuid,
            "name": slug,
            "seq": seq,
            "is_opened": False,
            "items": [],
        }
        parent_items.append(new_folder)
        parent_item["items"] = parent_items

        # Write updated global meta
        if not self._write_yaml_file(self.meta_file, global_meta):
            # Rollback: remove created directory
            if folder_dir.exists():
                self._delete_directory(folder_dir)
            raise Exception("Failed to write global meta file")

        return {
            "message": "Folder created successfully",
            "uuid": folder_uuid,
            "name": name,
            "slug": slug,
        }

    def delete_folder(self, uuid: str) -> Dict[str, Any]:
        """Delete a folder by UUID

        Args:
            uuid: UUID of the folder to delete

        Returns:
            Dictionary with deletion result including UUID and slug

        Raises:
            ValueError: If folder not found or item is not a folder
            Exception: If operation fails
        """
        # Read global meta
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find and remove the folder
        folder_data, parent_uuid, old_index = self._find_and_remove_item(
            global_meta, uuid
        )
        if not folder_data:
            raise ValueError(f"Folder with UUID '{uuid}' not found")

        # Verify it's a folder
        if folder_data.get("type") != "folder":
            raise ValueError(f"Item with UUID '{uuid}' is not a folder")

        # Get folder slug (directory name)
        slug = folder_data.get("name")
        if not slug:
            raise ValueError(f"Folder slug missing in meta: {folder_data}")

        # Build folder directory path
        parent_path = self._build_path_from_uuid(global_meta, parent_uuid)
        folder_dir = parent_path / slug

        # Reindex remaining items in parent
        if parent_uuid is None:
            parent_items = global_meta.get("collections", [])
        else:
            parent = self._find_item_by_uuid(global_meta, parent_uuid)
            if parent:
                parent_items = parent.get("items", [])
            else:
                parent_items = []

        if parent_items:
            self._reindex_items(parent_items)

        # Write updated global meta
        if not self._write_yaml_file(self.meta_file, global_meta):
            raise Exception("Failed to write global meta file")

        # Delete the folder directory
        if folder_dir.exists():
            try:
                self._delete_directory(folder_dir)
            except Exception as e:
                print(f"Warning: Failed to delete folder directory {folder_dir}: {e}")

        return {
            "message": "Folder deleted successfully",
            "uuid": uuid,
            "slug": slug,
        }

    def create_endpoint(
        self, name: str, parent_uuid: str, method: str, base_url: str, path: str
    ) -> Dict[str, Any]:
        """Create a new endpoint within a collection or folder

        Args:
            name: Display name for the endpoint
            parent_uuid: UUID of the parent collection or folder
            method: HTTP method (GET, POST, etc.)
            base_url: Base URL for the endpoint
            path: Request path

        Returns:
            Dictionary with creation result including UUID, name, and slug

        Raises:
            ValueError: If name is empty, parent not found, or endpoint already exists
            Exception: If operation fails
        """
        # Generate UUID and slug for the endpoint
        endpoint_uuid = str(uuid.uuid4())
        slug = self._generate_slug(name)

        # Read global meta
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find the parent (collection or folder)
        parent_item = self._find_item_by_uuid(global_meta, parent_uuid)
        if not parent_item:
            raise ValueError(f"Parent with UUID '{parent_uuid}' not found")

        # Build parent path
        parent_path = self._build_path_from_uuid(global_meta, parent_uuid)

        # Check if endpoint with this slug already exists
        endpoint_file = parent_path / f"{slug}.yaml"
        if endpoint_file.exists():
            raise ValueError(f"Endpoint name '{slug}' already exists in this location")

        # Create endpoint YAML file with default structure
        endpoint_data = {
            "uuid": endpoint_uuid,
            "type": "endpoint",
            "name": name,
            "description": "",
            "method": method.upper(),
            "base_url": base_url,
            "path": path,
            "cases": [
                {
                    "id": 1,
                    "name": "Default case",
                    "is_default": True,
                    "pre": None,
                    "post": None,
                    "request": {
                        "path_params": [],
                        "query_params": [],
                        "headers": [
                            {
                                "row_id": 1,
                                "keyValue": "Content-Type",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        "body": None,
                        "auth": None,
                    },
                    "expected_response": {
                        "status_code": 200,
                        "headers": [
                            {
                                "row_id": 1,
                                "keyValue": "Content-Type",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        "body": [],
                    },
                }
            ],
        }

        if not self._write_yaml_file(endpoint_file, endpoint_data):
            raise Exception(f"Failed to write endpoint file: {endpoint_file}")

        # Add endpoint to parent's items list
        parent_items = parent_item.get("items", [])
        seq = len(parent_items)

        new_endpoint = {
            "type": "endpoint",
            "uuid": endpoint_uuid,
            "name": slug,
            "seq": seq,
        }
        parent_items.append(new_endpoint)
        parent_item["items"] = parent_items

        # Write updated global meta
        if not self._write_yaml_file(self.meta_file, global_meta):
            # Rollback: remove created file
            if endpoint_file.exists():
                endpoint_file.unlink()
            raise Exception("Failed to write global meta file")

        return {
            "message": "Endpoint created successfully",
            "uuid": endpoint_uuid,
            "name": name,
            "slug": slug,
        }

    def delete_endpoint(self, uuid: str) -> Dict[str, Any]:
        """Delete an endpoint by UUID

        Args:
            uuid: UUID of the endpoint to delete

        Returns:
            Dictionary with deletion result including UUID and slug

        Raises:
            ValueError: If endpoint not found or item is not an endpoint
            Exception: If operation fails
        """
        # Read global meta
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find and remove the endpoint
        endpoint_data, parent_uuid, old_index = self._find_and_remove_item(
            global_meta, uuid
        )
        if not endpoint_data:
            raise ValueError(f"Endpoint with UUID '{uuid}' not found")

        # Verify it's an endpoint
        if endpoint_data.get("type") != "endpoint":
            raise ValueError(f"Item with UUID '{uuid}' is not an endpoint")

        # Get endpoint slug (file name without .yaml)
        slug = endpoint_data.get("name")
        if not slug:
            raise ValueError(f"Endpoint slug missing in meta: {endpoint_data}")

        # Build endpoint file path
        parent_path = self._build_path_from_uuid(global_meta, parent_uuid)
        endpoint_file = parent_path / f"{slug}.yaml"

        # Reindex remaining items in parent
        if parent_uuid is None:
            parent_items = global_meta.get("collections", [])
        else:
            parent = self._find_item_by_uuid(global_meta, parent_uuid)
            if parent:
                parent_items = parent.get("items", [])
            else:
                parent_items = []

        if parent_items:
            self._reindex_items(parent_items)

        # Write updated global meta
        if not self._write_yaml_file(self.meta_file, global_meta):
            raise Exception("Failed to write global meta file")

        # Delete the endpoint file
        if endpoint_file.exists():
            try:
                endpoint_file.unlink()
            except Exception as e:
                print(f"Warning: Failed to delete endpoint file {endpoint_file}: {e}")

        return {
            "message": "Endpoint deleted successfully",
            "uuid": uuid,
            "slug": slug,
        }

    def get_endpoint_detail(self, uuid: str) -> Dict[str, Any]:
        """Get full endpoint details by UUID

        Args:
            uuid: UUID of the endpoint

        Returns:
            Dictionary with full endpoint details including all cases and test configurations

        Raises:
            ValueError: If endpoint not found or item is not an endpoint
            FileNotFoundError: If endpoint file not found
        """
        # Read global meta
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find the endpoint in meta
        endpoint_meta = self._find_item_by_uuid(global_meta, uuid)
        if not endpoint_meta:
            raise ValueError(f"Endpoint with UUID '{uuid}' not found")

        # Verify it's an endpoint
        if endpoint_meta.get("type") != "endpoint":
            raise ValueError(f"Item with UUID '{uuid}' is not an endpoint")

        # Get endpoint slug (file name)
        slug = endpoint_meta.get("name")
        if not slug:
            raise ValueError(f"Endpoint slug missing in meta")

        # Find parent to build the correct path
        parent_uuid = self._find_parent_uuid(global_meta, uuid)
        parent_path = self._build_path_from_uuid(global_meta, parent_uuid)
        endpoint_file = parent_path / f"{slug}.yaml"

        # Read endpoint file
        if not endpoint_file.exists():
            raise FileNotFoundError(f"Endpoint file not found: {endpoint_file}")

        endpoint_data = self._read_yaml_file(endpoint_file)
        if not endpoint_data:
            raise Exception(f"Failed to parse endpoint file: {endpoint_file}")

        # Ensure the endpoint data has the UUID from metadata
        if "uuid" not in endpoint_data:
            endpoint_data["uuid"] = uuid

        # Construct URL from base_url and path if url is not present
        if "url" not in endpoint_data or not endpoint_data["url"]:
            base_url = endpoint_data.get("base_url", "")
            path = endpoint_data.get("path", "")
            endpoint_data["url"] = (
                f"{base_url}{path}" if base_url and path else base_url or path or ""
            )

        # Ensure cases have UUIDs
        if "cases" in endpoint_data:
            for i, case in enumerate(endpoint_data["cases"]):
                if "uuid" not in case:
                    # Generate a UUID for the case if missing
                    import uuid as uuid_lib

                    case["uuid"] = str(uuid_lib.uuid4())

        # Return endpoint details in the expected format
        return endpoint_data

    def update_endpoint(self, uuid: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an endpoint's YAML file with new data

        Args:
            uuid: Endpoint UUID
            updates: Dictionary of fields to update (only non-None values are updated)

        Returns:
            Dictionary with update result

        Raises:
            ValueError: If endpoint not found or item is not an endpoint
            FileNotFoundError: If endpoint file not found
            Exception: If operation fails
        """
        # Read global meta to find endpoint
        if not self.meta_file.exists():
            raise FileNotFoundError(
                f"Global meta file not found: {self.meta_file.resolve()}"
            )

        global_meta = self._read_global_meta()
        if not global_meta:
            raise Exception(
                f"Failed to parse global meta file: {self.meta_file.resolve()}"
            )

        # Find the endpoint in meta
        endpoint_meta = self._find_item_by_uuid(global_meta, uuid)
        if not endpoint_meta:
            raise ValueError(f"Endpoint with UUID '{uuid}' not found")

        # Verify it's an endpoint
        if endpoint_meta.get("type") != "endpoint":
            raise ValueError(f"Item with UUID '{uuid}' is not an endpoint")

        # Get endpoint slug and parent path
        slug = endpoint_meta.get("name")
        if not slug:
            raise ValueError(f"Endpoint slug missing in meta")

        parent_uuid = self._find_parent_uuid(global_meta, uuid)
        parent_path = self._build_path_from_uuid(global_meta, parent_uuid)
        endpoint_file = parent_path / f"{slug}.yaml"

        # Read current endpoint data
        if not endpoint_file.exists():
            raise FileNotFoundError(f"Endpoint file not found: {endpoint_file}")

        endpoint_data = self._read_yaml_file(endpoint_file)
        if not endpoint_data:
            raise Exception(f"Failed to parse endpoint file: {endpoint_file}")

        # Update fields (only update non-None values)
        for key, value in updates.items():
            if value is not None:
                endpoint_data[key] = value

        # Ensure UUID is preserved
        endpoint_data["uuid"] = uuid

        # Write back to file
        if not self._write_yaml_file(endpoint_file, endpoint_data):
            raise Exception(f"Failed to write endpoint file: {endpoint_file}")

        return {
            "message": "Endpoint updated successfully",
            "uuid": uuid,
        }
