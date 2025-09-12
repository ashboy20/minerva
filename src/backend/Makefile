dev:
	DEV_MODE=true uv run python main.py --host 0.0.0.0 --port 30000 --reload

prod:
	uv run python main.py --host 0.0.0.0 --port 30000

# Build with PyInstaller (recommended)
build:
	@echo "🚀 Building with PyInstaller..."
	uv pip install pyinstaller>=6.0.0
	uv run python build_pyinstaller.py

# Quick PyInstaller build
build-quick:
	@echo "⚡ Quick PyInstaller build..."
	uv run pyinstaller --onefile --name=minerva-backend \
		--hidden-import=uvicorn.protocols.http.auto \
		--hidden-import=uvicorn.protocols.http.h11_impl \
		--hidden-import=uvicorn.protocols.websockets.auto \
		--hidden-import=uvicorn.protocols.websockets.wsproto_impl \
		--hidden-import=uvicorn.lifespan.on \
		--hidden-import=uvicorn.lifespan.off \
		--hidden-import=uvicorn.loops.auto \
		--hidden-import=uvicorn.loops.asyncio \
		--hidden-import=uvicorn.server \
		--hidden-import=uvicorn.config \
		--hidden-import=sqlalchemy.dialects.sqlite \
		--hidden-import=app.api.endpoint_management \
		--hidden-import=app.models.endpoint \
		--hidden-import=app.services.endpoint_management \
		--hidden-import=app.db.connection \
		--add-data=app:app \
		main.py

# Build using spec file
build-spec:
	@echo "📋 Building with spec file..."
	uv run pyinstaller minerva-backend.spec

# Install build dependencies
install-build:
	uv pip install pyinstaller>=6.0.0

# Test app imports before building
test-app:
	@echo "🧪 Testing app imports..."
	uv run python test_app.py

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf build dist __pycache__
	find . -name "*.pyc" -delete
	find . -name "*.pyo" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} +


# Run the executable
run-exe:
	@if [ -f "./dist/minerva-backend" ]; then \
		echo "🚀 Starting executable..."; \
		./dist/minerva-backend --host 0.0.0.0 --port 30000; \
	elif [ -f "./dist/minerva-backend.exe" ]; then \
		echo "🚀 Starting executable..."; \
		./dist/minerva-backend.exe --host 0.0.0.0 --port 30000; \
	else \
		echo "❌ No executable found. Run 'make build' first."; \
	fi

.PHONY: dev prod build build-quick build-spec install-build test-app clean test-exe run-exe
