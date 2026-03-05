"""
Environment loader - loads .env files before any other module reads os.getenv.
"""

import os
import sys
from pathlib import Path


def load_environment() -> None:
    """
    Load environment variables from .env file.
    Searches for .env in project root and loads it.
    """
    file_dir = Path(__file__).resolve().parent
    project_root = file_dir.parent.parent.parent
    workspace_root = project_root.parent
    env_path = workspace_root / ".env"
    
    if not env_path.exists():
        return
    
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            
            if "=" in line:
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                
                if key and not os.environ.get(key):
                    os.environ[key] = value
