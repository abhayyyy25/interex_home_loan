#!/usr/bin/env python3
"""
FastAPI backend entry point
Run with: python backend/run.py
"""
import sys
import os
from pathlib import Path

# Add parent directory to Python path so backend module can be imported
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
sys.path.insert(0, str(project_root))

import uvicorn

if __name__ == "__main__":
    # Python backend runs on 8000, Node/Vite frontend on 5000
    port = 8000
    
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
