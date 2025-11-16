import argparse
import os
from fastapi import FastAPI
from app.routes.call_endpoint import router as call_endpoint_router
from app.routes.collections import router as collections_router
from app.db.connection import create_db_and_tables, DATABASE_PATH, add_seed_data
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
        call_endpoint_router,
        prefix="/api/call-endpoint",
        tags=["call-endpoint"],
    )
    app.include_router(
        collections_router,
        prefix="/api/collections",
        tags=["collections"],
    )

    # Initialize database
    if not DATABASE_PATH.exists():
        print("Initializing database...")
        create_db_and_tables()
        add_seed_data()
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
        "--port", type=int, default=30000, help="Port to run the server on"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Reload the server on code changes",
    )
    parser.add_argument(
        "--collection-root-dir", type=str, default="app/db/data/collections", help="Root directory for collections"
    )
    args = parser.parse_args()
    os.environ["COLLECTION_ROOT_DIR"] = args.collection_root_dir
    if os.getenv("DEV_MODE") == "true":
        uvicorn.run(
            "main:create_app", host=args.host, port=args.port, reload=args.reload
        )
    else:
        app = create_app()
        uvicorn.run(app, host=args.host, port=args.port, reload=args.reload)
