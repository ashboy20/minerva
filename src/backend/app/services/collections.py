import os
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

    def _is_collection_dir(self, dir_path: Path) -> bool:
        """Check if directory is a collection (has .mine.yaml)

        Args:
            dir_path: Path to check

        Returns:
            True if directory is a collection
        """
        return (dir_path / ".mine.yaml").exists()

    def _read_collection_metadata(self, dir_path: Path) -> Optional[Dict[str, Any]]:
        """Read collection/folder metadata from .mine.yaml

        Args:
            dir_path: Path to collection/folder directory

        Returns:
            Metadata dict or None
        """
        mine_file = dir_path / ".mine.yaml"
        if mine_file.exists():
            return self._read_yaml_file(mine_file)
        return None

    def _read_endpoint_metadata(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Read endpoint metadata from YAML file

        Args:
            file_path: Path to endpoint YAML file

        Returns:
            Endpoint metadata dict or None
        """
        return self._read_yaml_file(file_path)

    def _process_endpoint(self, file_path: Path) -> Optional[EndpointItem]:
        """Process endpoint file and extract minimal data

        Args:
            file_path: Path to endpoint YAML file

        Returns:
            EndpointItem or None
        """
        content = self._read_endpoint_metadata(file_path)
        if not content:
            return None

        meta = content.get("meta", {})
        data = content.get("data", {})

        # Only process endpoint files
        if meta.get("type") != "endpoint":
            return None

        return EndpointItem(
            uuid=data.get("uuid", ""),
            name=data.get("name", ""),
            seq=meta.get("seq", 0),
            method=data.get("method", "GET"),
        )

    def _process_folder(self, dir_path: Path) -> Optional[FolderItem]:
        """Process folder directory and extract minimal data

        Args:
            dir_path: Path to folder directory

        Returns:
            FolderItem or None
        """
        metadata = self._read_collection_metadata(dir_path)
        if not metadata:
            return None

        meta = metadata.get("meta", {})
        data = metadata.get("data", {})

        # Only process folder directories
        if meta.get("type") != "folder":
            return None

        folder = FolderItem(
            uuid=data.get("uuid", str(dir_path.name)),
            name=data.get("name", dir_path.name),
            seq=meta.get("seq", 0),
            items=[],
        )

        # Process items in folder
        items = []

        # Get all items in directory
        try:
            for item in sorted(dir_path.iterdir()):
                if item.name.startswith("."):
                    continue

                if item.is_dir():
                    # Recursive folder
                    subfolder = self._process_folder(item)
                    if subfolder:
                        items.append(subfolder)
                elif item.suffix in [".yaml", ".yml"] and item.name != ".mine.yaml":
                    # Endpoint file
                    endpoint = self._process_endpoint(item)
                    if endpoint:
                        items.append(endpoint)
        except Exception as e:
            print(f"Error processing folder {dir_path}: {e}")

        # Sort items by seq
        folder.items = sorted(items, key=lambda x: x.seq)

        return folder

    def _process_collection(self, dir_path: Path) -> Optional[CollectionItem]:
        """Process collection directory and extract minimal data

        Args:
            dir_path: Path to collection directory

        Returns:
            CollectionItem or None
        """
        metadata = self._read_collection_metadata(dir_path)
        if not metadata:
            return None

        meta = metadata.get("meta", {})
        data = metadata.get("data", {})

        # Only process collection directories
        if meta.get("type") != "collection":
            return None

        collection = CollectionItem(
            uuid=data.get("uuid", str(dir_path.name)),
            name=data.get("name", dir_path.name),
            seq=meta.get("seq", 0),
            items=[],
        )

        print("collection.seq", collection.seq)

        # Process items in collection
        items = []

        try:
            for item in sorted(dir_path.iterdir()):
                if item.name.startswith("."):
                    continue

                if item.is_dir():
                    # Check if it's a folder
                    folder = self._process_folder(item)
                    if folder:
                        items.append(folder)
                elif item.suffix in [".yaml", ".yml"] and item.name != ".mine.yaml":
                    # Endpoint file at collection level
                    endpoint = self._process_endpoint(item)
                    if endpoint:
                        items.append(endpoint)
        except Exception as e:
            print(f"Error processing collection {dir_path}: {e}")

        # Sort items by seq
        collection.items = sorted(items, key=lambda x: x.seq)

        return collection

    def get_collections_list(self) -> List[CollectionItem]:
        """Recursively read collections directory and return minimal data

        Returns:
            List of CollectionItem with nested folders and endpoints
        """
        collections = []

        # Check if collections directory exists
        if not self.collections_dir.exists():
            print(f"Collections directory not found: {self.collections_dir}")
            return collections

        # Process each collection directory
        try:
            for item in sorted(self.collections_dir.iterdir()):
                if item.is_dir() and not item.name.startswith("."):
                    collection = self._process_collection(item)
                    if collection:
                        collections.append(collection)
        except Exception as e:
            print(f"Error reading collections directory: {e}")

        # Sort collections by seq
        collections.sort(key=lambda x: (x.seq, x.name))

        return collections
