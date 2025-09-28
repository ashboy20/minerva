from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path
from app.models.endpoint_management import Collection
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
    """Add seed data to the database"""
    with open(SEED_DATA_PATH, "r") as f:
        seed_data = yaml.safe_load(f)

    if not seed_data.get("uuid"):
        seed_data["uuid"] = str(uuid.uuid4())

    collection = Collection(
        uuid=seed_data["uuid"],
        info=seed_data["info"],
        variables=seed_data["variables"],
        items=seed_data["items"],
    )

    with Session(engine) as session:
        session.add(collection)
        session.commit()


def reset_database():
    """Reset database by dropping all tables and recreating them with seed data"""
    import os

    # Close all connections to the database
    engine.dispose()

    # Remove the database file if it exists
    if DATABASE_PATH.exists():
        os.remove(DATABASE_PATH)
        print(f"Removed database file: {DATABASE_PATH}")

    # Recreate database and tables
    create_db_and_tables()
    print("Recreated database and tables")

    # Seed with initial data
    seed_data()
    print("Seeded database with initial data")


def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
