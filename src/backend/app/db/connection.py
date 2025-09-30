from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path
from app.models.endpoint_management import Collection, Folder, Endpoint
import uuid
import yaml

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


def create_db_and_tables():
    """Create database and tables"""
    SQLModel.metadata.create_all(engine)


def add_seed_data():
    """Add seed data to the database after tables are created"""
    # Ensure database and tables exist first
    create_db_and_tables()

    with open(SEED_DATA_PATH, "r") as f:
        seed_data = yaml.safe_load(f)

    if not seed_data.get("uuid"):
        seed_data["uuid"] = str(uuid.uuid4())

    with Session(engine) as session:
        # 1. Insert Collection
        collection = Collection(
            uuid=seed_data["uuid"],
            name=seed_data.get("name", "Default Collection"),
            description=seed_data.get("description", ""),
            variables=seed_data.get("variables", []),
            items=[],  # We'll populate this separately
        )
        session.add(collection)
        session.commit()

        # 2. Process items (folders and endpoints)
        collection_uuid = collection.uuid
        process_items(session, seed_data.get("items", []), collection_uuid)

        session.commit()


def process_items(session: Session, items: list, parent_uuid: str):
    """Recursively process items (folders and endpoints) and insert into appropriate tables"""
    for item in items:
        if item.get("type") == "folder":
            # Create folder
            folder_uuid = str(uuid.uuid4())
            folder = Folder(
                uuid=folder_uuid,
                name=item.get("name", ""),
                description=item.get("description", ""),
                parent_uuid=parent_uuid,
            )
            session.add(folder)
            session.flush()  # Flush to get the folder ID

            # Process folder's items (endpoints and sub-folders)
            process_items(session, item.get("items", []), folder_uuid)

        else:
            # Create endpoint
            endpoint_uuid = str(uuid.uuid4())
            endpoint = Endpoint(
                uuid=endpoint_uuid,
                name=item.get("name", ""),
                description=item.get("description", ""),
                method=item.get("method", "GET"),
                url=item.get("url", ""),
                parent_uuid=parent_uuid,
                cases=item.get("cases", []),
            )
            session.add(endpoint)


def reset_database():
    """Reset database by dropping all tables and recreating them with seed data"""
    import os

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
