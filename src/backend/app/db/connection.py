import os
from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

# TODO: Update to use new collection models when database models are created
# from app.models.endpoint_management import Case, Collection, Folder, Endpoint
import uuid
import yaml
from urllib.parse import urlparse

# Database configuration
DATABASE_DIR = Path(__file__).parent / "data"
DATABASE_FILE = "minerva.db"
DATABASE_PATH = DATABASE_DIR / DATABASE_FILE

# Ensure data directory exists
DATABASE_DIR.mkdir(exist_ok=True)

# SQLite connection string
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

SEED_DATA_FILE = "seed_data.yaml"
SEED_DATA_PATH = DATABASE_DIR / SEED_DATA_FILE

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Allow multiple threads for SQLite
    echo=False,  # Set to True for SQL debugging
)


def parse_url(url: str) -> tuple[str, str, str]:
    """Parse URL into base_url, full_url and path using urllib.parse

    Args:
        url: Full URL to parse

    Returns:
        Tuple of (base_url, full_url, path) where:
        - base_url is the scheme + netloc (e.g. 'https://api.example.com')
        - full_url is the complete URL
        - path is the path + query + fragment (e.g. '/users?id=1#info')
    """
    # Handle empty or None URLs
    if not url:
        return None, "", "/"

    # Parse the URL
    parsed = urlparse(url if "://" in url else f"http://{url}")

    # Extract base URL (scheme + netloc)
    base_url = None
    if parsed.scheme and parsed.netloc:
        base_url = f"{parsed.scheme}://{parsed.netloc}"

    # Build path (including query and fragment)
    path = parsed.path or "/"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    if parsed.fragment:
        path = f"{path}#{parsed.fragment}"

    # Ensure path starts with /
    if not path.startswith("/"):
        path = f"/{path}"

    # Full URL is either the original URL or constructed from parts
    full_url = url if "://" in url else f"http://{url}"

    return base_url, full_url, path


def create_db_and_tables():
    """Create database and tables"""
    SQLModel.metadata.create_all(engine)


def add_seed_data():
    """Add seed data to the database after tables are created"""
    # TODO: Update to use new collection models when database models are created
    # Temporarily disabled - needs to be updated to use new collection models
    print("Seed data functionality temporarily disabled - needs model update")
    pass
    # Ensure database and tables exist first
    # create_db_and_tables()

    # with open(SEED_DATA_PATH, "r") as f:
    #     seed_data = yaml.safe_load(f)

    # if not seed_data.get("uuid"):
    #     seed_data["uuid"] = str(uuid.uuid4())

    # with Session(engine) as session:
    #     # 1. Insert Collection
    #     collection = Collection(
    #         uuid=seed_data["uuid"],
    #         name=seed_data.get("name", "Default Collection"),
    #         description=seed_data.get("description", ""),
    #         variables=seed_data.get("variables", []),
    #         position=1,
    #         items=[],  # We'll populate this separately
    #     )
    #     session.add(collection)
    #     session.commit()

    #     # 2. Process items (folders and endpoints)
    #     collection_uuid = collection.uuid
    #     process_items(session, seed_data.get("items", []), collection_uuid)

    #     session.commit()


def process_items(session: Session, items: list, parent_uuid: str):
    """Recursively process items (folders and endpoints) and insert into appropriate tables"""
    # TODO: Update to use new collection models when database models are created
    print("process_items temporarily disabled - needs model update")
    pass
    # position_counter = {}
    # for item in items:
    #     if item.get("type") == "folder":
    #         # Create folder
    #         folder_uuid = str(uuid.uuid4())
    #         position_counter[parent_uuid] = position_counter.get(parent_uuid, 0) + 1
    #         folder = Folder(
    #             uuid=folder_uuid,
    #             name=item.get("name", ""),
    #             description=item.get("description", ""),
    #             parent_uuid=parent_uuid,
    #             position=position_counter[parent_uuid],
    #         )
    #         session.add(folder)
    #         session.flush()  # Flush to get the folder ID

    #         # Process folder's items (endpoints and sub-folders)
    #         process_items(session, item.get("items", []), folder_uuid)

    #     else:
    #         # Create endpoint
    #         endpoint_uuid = str(uuid.uuid4())
    #         position_counter[parent_uuid] = position_counter.get(parent_uuid, 0) + 1

    #         # Store the URL in the endpoint
    #         url = item.get("url", "")

    #         # Process cases
    #         cases = item.get("cases", [])
    #         for case in cases:
    #             case_uuid = str(uuid.uuid4())
    #             request = case.get("request", {})

    #             # Parse URL components for the request
    #             base_url, full_url, path = parse_url(url)
    #             request["base_url"] = base_url
    #             request["full_url"] = full_url
    #             request["path"] = path

    #             case = Case(
    #                 uuid=case_uuid,
    #                 name=case.get("name", ""),
    #                 description=case.get("description", ""),
    #                 request=request,
    #                 response=case.get("response", {}),
    #             ).model_dump(by_alias=True, mode="python")

    #         # Create endpoint with URL and processed cases
    #         endpoint = Endpoint(
    #             uuid=endpoint_uuid,
    #             name=item.get("name", ""),
    #             description=item.get("description", ""),
    #             method=item.get("method", "GET"),
    #             url=url,
    #             parent_uuid=parent_uuid,
    #             position=position_counter[parent_uuid],
    #             cases=cases,
    #         )
    #         session.add(endpoint)


def reset_database():
    """Reset database by dropping all tables and recreating them with seed data"""
    # Close all connections to the database
    engine.dispose()

    # Remove the database file if it exists
    if DATABASE_PATH.exists():
        os.remove(DATABASE_PATH)
        print(f"Removed database file: {DATABASE_PATH}")

    # Seed with initial data (this will also create the database and tables)
    add_seed_data()
    print("Recreated database and tables with seed data")


def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
