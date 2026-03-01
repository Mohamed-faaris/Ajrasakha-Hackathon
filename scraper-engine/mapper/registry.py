"""Canonical registry for managing crop identities."""

import json
import re
from pathlib import Path
from typing import Optional

from .models import CanonicalCrop, CropIndex


DATA_DIR = Path(__file__).parent / "data"
INDEX_FILE = DATA_DIR / "index.json"
SOURCES_DIR = DATA_DIR / "sources"


def _to_canonical_id(name: str) -> str:
    """Convert a name to canonical ID format (lowercase, underscores)."""
    normalized = name.lower().strip()
    normalized = re.sub(r'[^a-z0-9]+', '_', normalized)
    normalized = re.sub(r'_+', '_', normalized)
    return normalized.strip('_')


class CanonicalRegistry:
    """Manages the canonical crop registry and source aliases."""
    
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or DATA_DIR
        self.index_file = self.data_dir / "index.json"
        self.sources_dir = self.data_dir / "sources"
        self._ensure_directories()
        self._index = self._load_index()
    
    def _ensure_directories(self) -> None:
        """Ensure data directories exist."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.sources_dir.mkdir(exist_ok=True)
    
    def _load_index(self) -> CropIndex:
        """Load the canonical index from disk."""
        if self.index_file.exists():
            with open(self.index_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Handle both old format (dict) and new format (CropIndex)
                if "crops" in data:
                    return CropIndex.model_validate(data)
                else:
                    # Convert old format to new format
                    crops = {}
                    for id_, crop_data in data.items():
                        if isinstance(crop_data, dict):
                            crops[id_] = CanonicalCrop.model_validate(crop_data)
                    return CropIndex(crops=crops)
        return CropIndex()
    
    def _save_index(self) -> None:
        """Save the canonical index to disk."""
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(self._index.model_dump(), f, indent=2, ensure_ascii=False)
    
    def _load_source_aliases(self, source: str) -> dict[str, str]:
        """Load aliases for a specific source."""
        source_file = self.sources_dir / f"{source}.json"
        if source_file.exists():
            with open(source_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def _save_source_aliases(self, source: str, aliases: dict[str, str]) -> None:
        """Save aliases for a specific source."""
        source_file = self.sources_dir / f"{source}.json"
        with open(source_file, 'w', encoding='utf-8') as f:
            json.dump(aliases, f, indent=2, ensure_ascii=False)
    
    def get_or_create_crop(self, name: str) -> tuple[CanonicalCrop, bool]:
        """
        Get existing crop or create new canonical crop.
        
        Returns:
            Tuple of (crop, was_created)
        """
        canonical_id = _to_canonical_id(name)
        
        if canonical_id in self._index.crops:
            return self._index.crops[canonical_id], False
        
        # Create new canonical crop
        crop = CanonicalCrop(
            id=canonical_id,
            name=name.strip()
        )
        self._index.crops[canonical_id] = crop
        self._save_index()
        return crop, True
    
    def get_crop(self, canonical_id: str) -> Optional[CanonicalCrop]:
        """Get a crop by its canonical ID."""
        return self._index.crops.get(canonical_id)
    
    def update_crop(self, crop: CanonicalCrop) -> None:
        """Update an existing crop in the index."""
        self._index.crops[crop.id] = crop
        self._save_index()
    
    def add_alias(self, source: str, alias: str, canonical_id: str) -> None:
        """Add a source alias mapping to a canonical ID."""
        aliases = self._load_source_aliases(source)
        aliases[alias] = canonical_id
        self._save_source_aliases(source, aliases)
    
    def resolve_alias(self, source: str, alias: str) -> Optional[str]:
        """Resolve a source alias to a canonical ID."""
        aliases = self._load_source_aliases(source)
        return aliases.get(alias)
    
    def list_crops(self) -> list[CanonicalCrop]:
        """List all canonical crops."""
        return list(self._index.crops.values())
    
    def list_sources(self) -> list[str]:
        """List all source names."""
        sources = []
        if self.sources_dir.exists():
            for f in self.sources_dir.glob("*.json"):
                sources.append(f.stem)
        return sources
    
    def get_source_aliases(self, source: str) -> dict[str, str]:
        """Get all aliases for a source."""
        return self._load_source_aliases(source)
