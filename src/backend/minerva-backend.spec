# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Minerva Backend
This file configures how PyInstaller builds the FastAPI application
"""

import sys
from pathlib import Path

# Get the current directory
spec_dir = Path(SPECPATH)
src_dir = spec_dir

# Analysis phase - collect all Python files and dependencies
a = Analysis(
    ['main.py'],  # Entry point
    pathex=[str(src_dir)],  # Path to search for modules
    binaries=[],  # No binary files to include
    datas=[
        # Include the app package
        ('app', 'app'),
    ],
    hiddenimports=[
        # FastAPI and Uvicorn dependencies
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.protocols.websockets.wsproto_impl',
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.server',
        'uvicorn.config',
        'multipart',
        'email_validator',
        # SQLModel/SQLAlchemy dependencies
        'sqlalchemy.sql.default_comparator',
        'sqlalchemy.dialects.sqlite',
        'sqlalchemy.pool',
        'sqlalchemy.engine',
        'sqlalchemy.engine.default',
        # Pydantic dependencies
        'pydantic.v1',
        'pydantic._internal',
        'pydantic.json_schema',
        'pydantic.fields',
        # Our app modules - explicit imports
        'app',
        'app.api',
        'app.api.endpoint_management',
        'app.models',
        'app.models.endpoint',
        'app.services',
        'app.services.endpoint_management',
        'app.db',
        'app.db.connection',
        # Main module
        'main',
    ],
    hookspath=[],  # No custom hooks
    hooksconfig={},
    runtime_hooks=[],  # No runtime hooks
    excludes=[
        # Exclude unnecessary modules to reduce size
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
        'jupyter',
        'IPython',
        'pytest',
        'PIL',
    ],
    noarchive=False,
    optimize=0,
)

# Create the PYZ archive
pyz = PYZ(a.pure)

# Create the executable
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='minerva-backend',  # Executable name
    debug=False,  # Set to True for debugging
    bootloader_ignore_signals=False,
    strip=False,  # Set to True to reduce size on Linux/macOS
    upx=True,  # Use UPX compression if available
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Show console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # Additional options
    icon=None,  # No icon file
)

# For standalone directory build (alternative to onefile)
# Uncomment these lines and comment out the EXE block above for directory build
# coll = COLLECT(
#     exe,
#     a.binaries,
#     a.zipfiles,
#     a.datas,
#     strip=False,
#     upx=True,
#     upx_exclude=[],
#     name='minerva-backend'
# )
