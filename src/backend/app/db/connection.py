from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path
from app.models.endpoint_management import Endpoint, Request, Response, Case
import uuid

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
                            {
                                "row_id": 2,
                                "keyValue": "limit",
                                "value": "10",
                                "enabled": True,
                            },
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

        # Create Get User by ID endpoint with path parameter
        user_by_id_endpoint = Endpoint(
            operation_id="getUserById",
            name="Get User by ID",
            summary="Retrieve a specific user",
            description="Fetch a specific user by their ID from JSONPlaceholder API",
            method="GET",
            path="/users/:id",
            base_url="https://jsonplaceholder.typicode.com",
            cases=[
                Case(
                    name="Get specific user",
                    description="Retrieve user with ID 1",
                    request=Request(
                        headers=[
                            {
                                "row_id": 1,
                                "keyValue": "Accept",
                                "value": "application/json",
                                "enabled": True,
                            }
                        ],
                        query_params=[],
                        path_params=[
                            {
                                "row_id": 1,
                                "keyValue": "id",
                                "value": "1",
                                "enabled": True,
                            }
                        ],
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
                            "data": '{"id": 1, "name": "Leanne Graham", "username": "Bret", "email": "Sincere@april.biz", "address": {"street": "Kulas Light", "suite": "Apt. 556", "city": "Gwenborough", "zipcode": "92998-3874", "geo": {"lat": "-37.3159", "lng": "81.1496"}}, "phone": "1-770-736-8031 x56442", "website": "hildegard.org", "company": {"name": "Romaguera-Crona", "catchPhrase": "Multi-layered client-server neural-net", "bs": "harness real-time e-markets"}}'
                        },
                    ).dict(),
                ).dict()
            ],
        )
        session.add(user_by_id_endpoint)
        session.commit()
        session.refresh(user_by_id_endpoint)

        # Create Update User endpoint with path parameter
        update_user_endpoint = Endpoint(
            operation_id="updateUser",
            name="Update User",
            summary="Update a user",
            description="Update a specific user by their ID",
            method="PUT",
            path="/users/:id",
            base_url="https://jsonplaceholder.typicode.com",
            cases=[
                Case(
                    name="Update user info",
                    description="Update user with ID 1",
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
                        path_params=[
                            {
                                "row_id": 1,
                                "keyValue": "id",
                                "value": "1",
                                "enabled": True,
                            }
                        ],
                        body={
                            "id": 1,
                            "name": "Updated Name",
                            "username": "updateduser",
                            "email": "updated@example.com",
                        },
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
                            "data": '{"id": 1, "name": "Updated Name", "username": "updateduser", "email": "updated@example.com"}'
                        },
                    ).dict(),
                ).dict()
            ],
        )
        session.add(update_user_endpoint)
        session.commit()
        session.refresh(update_user_endpoint)

        # Commit all changes
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
