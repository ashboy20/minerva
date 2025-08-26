import argparse
import os
from fastapi import FastAPI
from app.api.endpoint_management import router as endpoint_management_router
from app.db.connection import create_db_and_tables, DATABASE_PATH, seed_data
import uvicorn


def create_app() -> FastAPI:
    """Application factory"""
    app = FastAPI(
        title="Minerva Backend API",
        description="Backend service for Minerva API client",
        version="0.1.0",
    )

    # Root endpoint
    @app.get("/")
    async def root():
        return {"message": "Welcome to Minerva BE"}

    # Include routers
    app.include_router(
        endpoint_management_router,
        prefix="/api/endpoint-management",
        tags=["endpoint-management"],
    )

    # Initialize database
    if not DATABASE_PATH.exists():
        print("Initializing database...")
        create_db_and_tables()
        seed_data()
        print("Database initialized.")
    else:
        print("Database already exists. Skipping initialization.")

    return app


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Minerva Backend API")
    parser.add_argument(
        "--host", type=str, default="0.0.0.0", help="Host to run the server on"
    )
    parser.add_argument(
        "--port", type=int, default=50051, help="Port to run the server on"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Reload the server on code changes",
    )
    args = parser.parse_args()
    if os.getenv("DEV_MODE") == "true":
        uvicorn.run(
            "main:create_app", host=args.host, port=args.port, reload=args.reload
        )
    else:
        app = create_app()
        uvicorn.run(app, host=args.host, port=args.port, reload=args.reload)
