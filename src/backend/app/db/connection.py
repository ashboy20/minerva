from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path
from app.models.endpoint import EndpointData

# Database configuration
DATABASE_DIR = Path(__file__).parent / "data"
DATABASE_FILE = "minerva.db"
DATABASE_PATH = DATABASE_DIR / DATABASE_FILE

# Ensure data directory exists
DATABASE_DIR.mkdir(exist_ok=True)

# SQLite connection string
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Allow multiple threads for SQLite
    echo=False  # Set to True for SQL debugging
)

def create_db_and_tables():
    """Create database and tables"""
    SQLModel.metadata.create_all(engine)

def seed_data():
    """Seed data into the database"""
    with Session(engine) as session:
        session.add(EndpointData(name="Get Users", method="GET", url="https://jsonplaceholder.typicode.com/users", description="Fetch all users from JSONPlaceholder API"))
        session.add(EndpointData(name="Create Post", method="POST", url="https://jsonplaceholder.typicode.com/posts", description="Create a new post"))
        session.add(EndpointData(name="Get Posts", method="GET", url="https://jsonplaceholder.typicode.com/posts", description="Fetch all posts"))
        session.commit()

def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
