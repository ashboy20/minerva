dev:
	@echo "🚀 Starting development server..."
	cd src/backend && DEV_MODE=true uv run python main.py --host 0.0.0.0 --port 30000 --reload

prod:
	@echo "🚀 Starting production server..."
	cd src/backend && uv run python main.py --host 0.0.0.0 --port 30000

remove-db:
	@echo "🧹 Removing database..."
	rm -rf src/backend/app/db/data/minerva.db


# Build with PyInstaller (recommended)
build:
	@echo "🚀 Building with PyInstaller..."
	cd src/backend && uv pip install pyinstaller>=6.0.0
	cd src/backend && uv run python build_pyinstaller.py


.PHONY: dev prod build