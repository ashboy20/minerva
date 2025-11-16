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
