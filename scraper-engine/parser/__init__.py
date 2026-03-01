"""
Parser module initialization.

This module contains parsers for various agricultural data sources.
"""

from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent
SCRIPTS_DIR = BASE_DIR / "scripts"
DATA_DIR = BASE_DIR / "data"

__all__ = ["BASE_DIR", "SCRIPTS_DIR", "DATA_DIR"]
