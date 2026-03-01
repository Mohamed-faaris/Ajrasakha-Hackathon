"""
Pydantic models for data validation and schema definition.
"""

from __future__ import annotations

import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


class RawPriceRecord(BaseModel):
    """Input record from parser - represents raw data from a source."""
    
    crop_name: str = Field(..., description="Raw crop name from source")
    mandi_name: str = Field(..., description="Raw mandi/market name from source")
    state_name: Optional[str] = Field(None, description="State name if available")
    date: str = Field(..., description="Date string in various formats")
    min_price: Optional[float] = Field(None, description="Minimum price")
    max_price: Optional[float] = Field(None, description="Maximum price")
    modal_price: Optional[float] = Field(None, description="Modal/most common price")
    unit: Optional[str] = Field(None, description="Price unit (quintal, kg, etc.)")
    arrival: Optional[float] = Field(None, description="Arrival quantity")
    source: str = Field(..., description="Data source identifier")
    
    # Allow extra fields for source-specific data
    model_config = {"extra": "allow"}
    
    @field_validator("crop_name", "mandi_name", "state_name", "unit", "source")
    @classmethod
    def strip_strings(cls, v: Optional[str]) -> Optional[str]:
        """Strip whitespace from string fields."""
        if v is None:
            return v
        return v.strip()


class ValidatedRecord(BaseModel):
    """Validated and cleaned record ready for mapper consumption."""
    
    crop_id: Optional[str] = Field(None, description="Canonical crop ID")
    crop_name: str = Field(..., description="Normalized crop name")
    mandi_id: Optional[str] = Field(None, description="Canonical mandi ID")
    mandi_name: str = Field(..., description="Normalized mandi name")
    state_id: Optional[str] = Field(None, description="State ID")
    state_name: Optional[str] = Field(None, description="Normalized state name")
    date: datetime.date = Field(..., description="Parsed date")
    min_price: Optional[float] = Field(None, description="Normalized minimum price")
    max_price: Optional[float] = Field(None, description="Normalized maximum price")
    modal_price: Optional[float] = Field(None, description="Normalized modal price")
    unit: str = Field(default="quintal", description="Normalized unit")
    arrival: Optional[float] = Field(None, description="Arrival quantity")
    source: str = Field(..., description="Data source")
    raw_data: dict[str, Any] = Field(default_factory=dict, description="Original raw data")
    
    @field_validator("unit")
    @classmethod
    def normalize_unit(cls, v: str) -> str:
        """Normalize unit to standard format."""
        unit_map = {
            "q": "quintal",
            "qtl": "quintal",
            "quintal": "quintal",
            "kg": "kg",
            "kilogram": "kg",
            "ton": "ton",
            "tonne": "ton",
            "mt": "ton",
        }
        return unit_map.get(v.lower().strip(), v.lower().strip())


class LoadStats(BaseModel):
    """Statistics for a load operation."""
    
    total_records: int = Field(0, description="Total records found")
    valid_records: int = Field(0, description="Records that passed validation")
    invalid_records: int = Field(0, description="Records that failed validation")
    duplicate_records: int = Field(0, description="Duplicate records detected")
    filtered_records: int = Field(0, description="Records filtered out")
    sources_processed: list[str] = Field(default_factory=list, description="Sources processed")
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_records == 0:
            return 0.0
        return (self.valid_records / self.total_records) * 100


class DataLoadResult(BaseModel):
    """Result of a data loading operation."""
    
    data: list[ValidatedRecord] = Field(default_factory=list, description="Loaded and validated records")
    stats: LoadStats = Field(default_factory=LoadStats, description="Loading statistics")
    errors: list[str] = Field(default_factory=list, description="Error messages")
    source: Optional[str] = Field(None, description="Source name if single source")
    date: Optional[str] = Field(None, description="Date string")
    
    def to_dict(self) -> dict[str, Any]:
        """Convert result to dictionary for serialization."""
        return {
            "data": [record.model_dump() for record in self.data],
            "stats": self.stats.model_dump(),
            "errors": self.errors,
            "source": self.source,
            "date": self.date,
        }
