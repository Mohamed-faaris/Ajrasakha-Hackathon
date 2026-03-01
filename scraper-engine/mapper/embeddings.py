"""Embedding engine for semantic crop search."""

import json
import math
import re
from pathlib import Path
from typing import Optional

from .models import CanonicalCrop, CropMatchResult


DATA_DIR = Path(__file__).parent / "data"
EMBEDDINGS_FILE = DATA_DIR / "embeddings" / "crops.json"


class EmbeddingEngine:
    """Manages embeddings and semantic search for crops."""
    
    def __init__(self, data_dir: Optional[Path] = None, model_name: Optional[str] = None):
        self.data_dir = data_dir or DATA_DIR
        self.embeddings_file = self.data_dir / "embeddings" / "crops.json"
        self.embeddings_file.parent.mkdir(parents=True, exist_ok=True)
        
        self._embeddings: dict[str, list[float]] = {}
        self._metadata: dict[str, dict] = {}
        self._model = None
        self._use_transformer = False
        
        # Try to load sentence-transformers
        if model_name:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(model_name)
                self._use_transformer = True
            except ImportError:
                pass
        
        self._load_embeddings()
    
    def _load_embeddings(self) -> None:
        """Load embeddings from disk."""
        if self.embeddings_file.exists():
            with open(self.embeddings_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self._embeddings = data.get("embeddings", {})
                self._metadata = data.get("metadata", {})
    
    def _save_embeddings(self) -> None:
        """Save embeddings to disk."""
        with open(self.embeddings_file, 'w', encoding='utf-8') as f:
            json.dump({
                "embeddings": self._embeddings,
                "metadata": self._metadata
            }, f, indent=2)
    
    def _tokenize(self, text: str) -> set[str]:
        """Simple tokenization for fallback embedding."""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        return set(text.split())
    
    def _fallback_embedding(self, text: str, dim: int = 384) -> list[float]:
        """Generate a simple hash-based embedding when transformers unavailable."""
        tokens = self._tokenize(text)
        embedding = [0.0] * dim
        
        # Hash-based feature generation
        for token in tokens:
            for i, char in enumerate(token[:8]):
                idx = (hash(token) + i * 31) % dim
                embedding[idx] += (ord(char) % 10) / 10.0
        
        # Normalize
        norm = math.sqrt(sum(x * x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]
        
        return embedding
    
    def generate_embedding(self, text: str) -> list[float]:
        """Generate embedding for text using available model."""
        if self._use_transformer and self._model:
            return self._model.encode(text).tolist()
        return self._fallback_embedding(text)
    
    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot / (norm_a * norm_b)
    
    def add_crop_embedding(self, crop: CanonicalCrop, aliases: Optional[list[str]] = None) -> None:
        """Generate and store embedding for a canonical crop."""
        # Combine name and aliases for richer embedding
        texts = [crop.name]
        if aliases:
            texts.extend(aliases)
        if crop.aliases:
            texts.extend(crop.aliases)
        
        combined_text = " | ".join(texts)
        embedding = self.generate_embedding(combined_text)
        
        self._embeddings[crop.id] = embedding
        self._metadata[crop.id] = {
            "canonical_name": crop.name,
            "aliases": aliases or crop.aliases or []
        }
        self._save_embeddings()
    
    def search_similar(self, query: str, top_k: int = 5, threshold: float = 0.3) -> list[CropMatchResult]:
        """Search for crops semantically similar to query."""
        query_embedding = self.generate_embedding(query)
        
        results = []
        for crop_id, emb in self._embeddings.items():
            score = self._cosine_similarity(query_embedding, emb)
            if score >= threshold:
                from .registry import CanonicalRegistry
                registry = CanonicalRegistry(self.data_dir)
                crop = registry.get_crop(crop_id)
                if crop:
                    results.append(CropMatchResult(crop=crop, score=score))
        
        # Sort by score descending
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]
    
    def has_embedding(self, crop_id: str) -> bool:
        """Check if a crop has an embedding."""
        return crop_id in self._embeddings
    
    def get_embedding_stats(self) -> dict:
        """Get statistics about stored embeddings."""
        return {
            "total_embeddings": len(self._embeddings),
            "using_transformer": self._use_transformer,
            "embedding_dim": len(next(iter(self._embeddings.values()))) if self._embeddings else 0
        }
