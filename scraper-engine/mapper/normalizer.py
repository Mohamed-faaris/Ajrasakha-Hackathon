"""Crop normalizer - main interface for name resolution."""

import re
from pathlib import Path
from typing import Optional

from .models import CanonicalCrop, CropMatchResult
from .registry import CanonicalRegistry, _to_canonical_id
from .embeddings import EmbeddingEngine


class CropNormalizer:
    """Normalizes crop names from various sources to canonical IDs."""
    
    def __init__(self, data_dir: Optional[Path] = None, model_name: Optional[str] = None):
        self.data_dir = data_dir
        self.registry = CanonicalRegistry(data_dir)
        self.embeddings = EmbeddingEngine(data_dir, model_name)
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison."""
        return text.lower().strip()
    
    def _exact_match(self, normalized_name: str) -> Optional[CanonicalCrop]:
        """Try exact match against canonical IDs and names."""
        canonical_id = _to_canonical_id(normalized_name)
        
        # Try canonical ID
        crop = self.registry.get_crop(canonical_id)
        if crop:
            return crop
        
        # Try matching against crop names (case insensitive)
        for c in self.registry.list_crops():
            if self._normalize_text(c.name) == normalized_name:
                return c
            for alias in c.aliases:
                if self._normalize_text(alias) == normalized_name:
                    return c
        
        return None
    
    def normalize(self, crop_name: str, source: Optional[str] = None) -> Optional[str]:
        """
        Normalize a crop name to its canonical ID.
        
        Strategy:
        1. Check source aliases (if source provided)
        2. Check exact match against canonical names/IDs
        3. Try semantic search for similar crops
        4. Return best match or None
        
        Returns:
            Canonical ID or None if no match found
        """
        if not crop_name or not crop_name.strip():
            return None
        
        normalized_input = self._normalize_text(crop_name)
        
        # 1. Check source alias
        if source:
            canonical_id = self.registry.resolve_alias(source, crop_name)
            if canonical_id:
                return canonical_id
        
        # 2. Exact match
        crop = self._exact_match(normalized_input)
        if crop:
            # Auto-add source alias for future lookups
            if source:
                self.registry.add_alias(source, crop_name, crop.id)
            return crop.id
        
        # 3. Semantic search
        results = self.embeddings.search_similar(crop_name, top_k=1, threshold=0.7)
        if results:
            best_match = results[0]
            # Auto-add source alias for high-confidence matches
            if source and best_match.score > 0.85:
                self.registry.add_alias(source, crop_name, best_match.crop.id)
            return best_match.crop.id
        
        return None
    
    def normalize_or_create(self, crop_name: str, source: Optional[str] = None) -> str:
        """
        Normalize crop name, creating new canonical entry if not found.
        
        Returns:
            Canonical ID (existing or newly created)
        """
        # Try normalization first
        canonical_id = self.normalize(crop_name, source)
        if canonical_id:
            return canonical_id
        
        # Create new canonical crop
        crop, _ = self.registry.get_or_create_crop(crop_name)
        
        # Generate embedding
        if not self.embeddings.has_embedding(crop.id):
            self.embeddings.add_crop_embedding(crop)
        
        # Add source alias
        if source:
            self.registry.add_alias(source, crop_name, crop.id)
        
        return crop.id
    
    def search(self, query: str, top_k: int = 5) -> list[CropMatchResult]:
        """Search for crops matching the query."""
        if not query or not query.strip():
            return []
        
        results = []
        normalized_query = self._normalize_text(query)
        
        # Include exact matches
        crop = self._exact_match(normalized_query)
        if crop:
            results.append(CropMatchResult(crop=crop, score=1.0))
        
        # Include semantic matches
        semantic_results = self.embeddings.search_similar(query, top_k=top_k)
        seen_ids = {r.crop.id for r in results}
        
        for r in semantic_results:
            if r.crop.id not in seen_ids:
                results.append(r)
        
        return results[:top_k]
    
    def get_crop(self, canonical_id: str) -> Optional[CanonicalCrop]:
        """Get crop by canonical ID."""
        return self.registry.get_crop(canonical_id)
    
    def list_all_crops(self) -> list[CanonicalCrop]:
        """List all canonical crops."""
        return self.registry.list_crops()
    
    def add_crop(self, name: str, aliases: Optional[list[str]] = None) -> CanonicalCrop:
        """Add a new canonical crop with embedding."""
        crop, _ = self.registry.get_or_create_crop(name)
        
        if aliases:
            crop.aliases = list(set(crop.aliases + aliases))
            self.registry.update_crop(crop)
        
        if not self.embeddings.has_embedding(crop.id):
            self.embeddings.add_crop_embedding(crop, aliases)
        
        return crop
