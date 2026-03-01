"""Pydantic models for the crop mapper system."""

from pydantic import BaseModel, Field
from typing import Optional


class CanonicalCrop(BaseModel):
    """A canonical crop record in the index."""
    id: str = Field(..., description="Unique lowercase ID")
    name: str = Field(..., description="Display name")
    aliases: list[str] = Field(default_factory=list, description="Known aliases")
    embedding: Optional[list[float]] = Field(default=None, description="Vector embedding")


class SourceAliasMap(BaseModel):
    """Mapping from source-specific names to canonical IDs."""
    source: str = Field(..., description="Source name")
    mappings: dict[str, str] = Field(default_factory=dict, description="Alias → canonical ID")


class CropMatchResult(BaseModel):
    """Result of a crop similarity search."""
    crop: CanonicalCrop
    score: float = Field(..., ge=0.0, le=1.0, description="Similarity score")


class CropIndex(BaseModel):
    """Root model for the canonical crop index."""
    crops: dict[str, CanonicalCrop] = Field(default_factory=dict)
