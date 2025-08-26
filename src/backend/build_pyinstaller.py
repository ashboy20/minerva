#!/usr/bin/env python3
"""
PyInstaller build script for Minerva Backend
Simple script to build the FastAPI backend into a standalone executable
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path


def check_pyinstaller():
    """Check if PyInstaller is installed"""
    try:
        subprocess.run(["pyinstaller", "--version"], capture_output=True, check=True)
        print("✅ PyInstaller is installed")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ PyInstaller is not installed")
        print("📦 Installing PyInstaller...")
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "pyinstaller>=6.0.0"],
                check=True,
            )
            print("✅ PyInstaller installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install PyInstaller")
            return False


def clean_build():
    """Clean previous build artifacts"""
    print("🧹 Cleaning previous build artifacts...")

    # Remove build directories and files
    for pattern in ["build", "dist", "__pycache__"]:
        for path in Path(".").glob(f"**/{pattern}"):
            if path.is_dir():
                shutil.rmtree(path)
                print(f"   Removed: {path}")

    # Remove spec files if they exist (we'll use our custom one)
    for spec_file in ["main.spec"]:
        if Path(spec_file).exists():
            Path(spec_file).unlink()
            print(f"   Removed: {spec_file}")


def build_executable():
    """Build the executable using PyInstaller"""
    print("🔨 Building executable with PyInstaller...")

    # Check if spec file exists
    spec_file = "minerva-backend.spec"
    if not Path(spec_file).exists():
        print(f"❌ Spec file not found: {spec_file}")
        print("📝 Creating basic spec file...")

        # Create a basic spec file if it doesn't exist
        cmd = [
            "pyinstaller",
            "--onefile",
            "--name=minerva-backend",
            "--hidden-import=uvicorn.protocols.http.auto",
            "--hidden-import=uvicorn.protocols.http.h11_impl",
            "--hidden-import=uvicorn.protocols.websockets.auto",
            "--hidden-import=uvicorn.protocols.websockets.wsproto_impl",
            "--hidden-import=uvicorn.lifespan.on",
            "--hidden-import=uvicorn.lifespan.off",
            "--hidden-import=uvicorn.loops.auto",
            "--hidden-import=uvicorn.loops.asyncio",
            "--hidden-import=uvicorn.server",
            "--hidden-import=uvicorn.config",
            "--hidden-import=sqlalchemy.dialects.sqlite",
            "--hidden-import=app.api.endpoint_management",
            "--hidden-import=app.models.endpoint",
            "--hidden-import=app.services.endpoint_management",
            "--hidden-import=app.db.connection",
            "--add-data=app:app",
            "main.py",
        ]
    else:
        # Use the spec file
        cmd = ["pyinstaller", spec_file]

    try:
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, check=True)
        print("✅ Build completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed with exit code {e.returncode}")
        return False


def verify_executable():
    """Verify the built executable"""
    print("🔍 Verifying executable...")

    # Find the executable in dist directory
    dist_dir = Path("dist")
    if not dist_dir.exists():
        print("❌ Dist directory not found")
        return False

    exe_name = "minerva-backend.exe" if os.name == "nt" else "minerva-backend"
    exe_path = dist_dir / exe_name

    if not exe_path.exists():
        print(f"❌ Executable not found: {exe_path}")
        # List what's in the dist directory
        print("📁 Contents of dist directory:")
        for item in dist_dir.iterdir():
            print(f"   {item}")
        return False

    # Get file size
    size_mb = exe_path.stat().st_size / (1024 * 1024)
    print(f"✅ Executable created: {exe_path} ({size_mb:.1f} MB)")

    # Test if it runs (quick check)
    try:
        result = subprocess.run(
            [str(exe_path), "--help"], capture_output=True, timeout=10
        )
        if result.returncode == 0:
            print("✅ Executable runs successfully")
        else:
            print("⚠️  Executable runs but may have issues")
            print(f"Output: {result.stdout.decode()}")
            print(f"Error: {result.stderr.decode()}")
        return True
    except subprocess.TimeoutExpired:
        print("⚠️  Executable test timed out")
        return True
    except Exception as e:
        print(f"⚠️  Could not test executable: {e}")
        return True


def main():
    """Main build process"""
    print("🚀 Starting Minerva Backend PyInstaller build...")
    print("=" * 50)

    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    print(f"📁 Working directory: {backend_dir}")

    # Step 1: Check PyInstaller installation
    if not check_pyinstaller():
        print("❌ Build failed: PyInstaller not available")
        sys.exit(1)

    # Step 2: Clean previous builds
    clean_build()

    # Step 3: Build executable
    if not build_executable():
        print("❌ Build failed during compilation")
        sys.exit(1)

    # Step 4: Verify executable
    if not verify_executable():
        print("❌ Build failed during verification")
        sys.exit(1)

    print("=" * 50)
    print("🎉 Build completed successfully!")
    print("📦 Executable location: dist/minerva-backend")
    print("💡 To run: ./dist/minerva-backend --help")


if __name__ == "__main__":
    main()
