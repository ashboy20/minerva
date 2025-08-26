from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path
from app.models.endpoint import Endpoint, Request, Response, Case

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
    echo=False,  # Set to True for SQL debugging
)


def create_db_and_tables():
    """Create database and tables"""
    SQLModel.metadata.create_all(engine)


def seed_data():
    """Seed data into the database using the new cases-based structure"""
    with Session(engine) as session:

        # Create Get Users endpoint
        users_endpoint = Endpoint(
            operation_id="getAllUsers",
            name="Get Users",
            summary="Retrieve all users",
            description="Fetch all users from JSONPlaceholder API with their basic information",
            method="GET",
            path="/users",
            base_url="https://jsonplaceholder.typicode.com",
            cases=[
                Case(
                    name="Basic retrieval",
                    description="Retrieve all users with default settings",
                    request=Request(
                        headers=[
                            {
                                "row_id": 1,
                                "keyValue": "Accept",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        query_params=[
                            {
                                "row_id": 1,
                                "keyValue": "limit",
                                "value": "10",
                                "enabled": True,
                            }
                        ],
                        path_params=[],
                        body=None,
                    ).dict(),
                    response=Response(
                        status_code=200,
                        headers=[
                            {
                                "row_id": 1,
                                "keyValue": "Content-Type",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        body={
                            "data": '[{"id": 1, "name": "Leanne Graham", "email": "Sincere@april.biz", "username": "Bret"}]'
                        },
                    ).dict(),
                ).dict()
            ],
        )
        session.add(users_endpoint)
        session.commit()
        session.refresh(users_endpoint)

        # Create Post endpoint
        create_post_endpoint = Endpoint(
            operation_id="createPost",
            name="Create Post",
            summary="Create a new post",
            description="Create a new post in the JSONPlaceholder API",
            method="POST",
            path="/posts",
            base_url="https://jsonplaceholder.typicode.com",
            cases=[
                Case(
                    name="Basic creation",
                    description="Create a post with title and body",
                    request=Request(
                        headers=[
                            {
                                "row_id": 1,
                                "keyValue": "Content-Type",
                                "value": "application/json",
                                "enabled": True,
                            },
                            {   
                                "row_id": 2,
                                "keyValue": "Accept",
                                "value": "application/json",
                                "enabled": True,
                            },
                        ],
                        query_params=[],
                        path_params=[],
                        body={"title": "foo", "body": "bar", "userId": 1},
                    ).dict(),
                    response=Response(
                        status_code=201,
                        headers=[
                            {
                                "row_id": 1,
                                "keyValue": "Content-Type",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        body={
                            "data": '{"id": 101, "title": "foo", "body": "bar", "userId": 1}'
                        },
                    ).dict(),
                ).dict()
            ],
        )
        session.add(create_post_endpoint)
        session.commit()
        session.refresh(create_post_endpoint)

        # Create Get Posts endpoint
        posts_endpoint = Endpoint(
            operation_id="getAllPosts",
            name="Get Posts",
            summary="Retrieve all posts",
            description="Fetch all posts from JSONPlaceholder API with optional filtering",
            method="GET",
            path="/posts",
            base_url="https://jsonplaceholder.typicode.com",
            cases=[
                Case(
                    name="Filtered retrieval",
                    description="Retrieve posts filtered by userId",
                    request=Request(
                        headers=[
                            {
                                "row_id": 1,
                                "keyValue": "Accept",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        query_params=[
                            {
                                "row_id": 1,
                                "keyValue": "userId",
                                "value": "1",
                                "enabled": True,
                            },
                            {"row_id": 2, "keyValue": "limit", "value": "10", "enabled": True},
                        ],
                        path_params=[],
                        body=None,
                    ).dict(),
                    response=Response(
                        status_code=200,
                        headers=[
                            {
                                "row_id": 1,
                                "keyValue": "Content-Type",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        body={
                            "data": '[{"userId": 1, "id": 1, "title": "sunt aut facere", "body": "quia et suscipit"}]'
                        },
                    ).dict(),
                ).dict()
            ],
        )
        session.add(posts_endpoint)
        session.commit()
        session.refresh(posts_endpoint)

        # Commit all changes
        session.commit()


def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
