"""
Main data loading logic for the loader module.

Reads parsed data from parser/data directory, validates against schema,
filters and cleans records, and aggregates data from multiple sources.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from datetime import date
from typing import Optional

from loader.schema import RawPriceRecord, ValidatedRecord, DataLoadResult, LoadStats
from loader.processor import (
    normalize_date,
    normalize_price,
    clean_string,
    detect_duplicates,
    normalize_unit,
    parse_price,
)


# Default base path for parser data
DEFAULT_DATA_PATH = Path(__file__).parent.parent / "parser" / "data"


class DataLoader:
    """
    Main data loader class for reading and validating parsed data.
    
    Reads from parser/data/[source]/[date].json files, validates data structure,
    filters and cleans records, and aggregates data from multiple sources.
    """
    
    def __init__(self, data_path: Optional[Path | str] = None):
        """
        Initialize the DataLoader.
        
        Args:
            data_path: Path to the parser data directory. Defaults to ../parser/data
        """
        self.data_path = Path(data_path) if data_path else DEFAULT_DATA_PATH
        self._ensure_data_directory()
    
    def _ensure_data_directory(self) -> None:
        """Ensure the data directory exists."""
        if not self.data_path.exists():
            self.data_path.mkdir(parents=True, exist_ok=True)
    
    def _get_source_path(self, source_name: str) -> Path:
        """Get the path for a specific source directory."""
        return self.data_path / source_name
    
    def _get_data_file_path(self, source_name: str, date_str: str) -> Path:
        """Get the path for a specific data file."""
        return self._get_source_path(source_name) / f"{date_str}.json"
    
    def load_source(self, source_name: str, date_str: str) -> DataLoadResult:
        """
        Load data from a specific source and date.
        
        Args:
            source_name: Name of the source (e.g., 'agmarknet')
            date_str: Date string in YYYY-MM-DD format
            
        Returns:
            DataLoadResult containing loaded and validated records
        """
        result = DataLoadResult(source=source_name, date=date_str)
        file_path = self._get_data_file_path(source_name, date_str)
        
        if not file_path.exists():
            result.errors.append(f"File not found: {file_path}")
            return result
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
        except json.JSONDecodeError as e:
            result.errors.append(f"JSON decode error: {e}")
            return result
        except Exception as e:
            result.errors.append(f"Error reading file: {e}")
            return result
        
        # Handle both single records and lists
        if isinstance(raw_data, dict):
            raw_records = raw_data.get("data", [raw_data])
        elif isinstance(raw_data, list):
            raw_records = raw_data
        else:
            result.errors.append(f"Unexpected data format: {type(raw_data)}")
            return result
        
        result.stats.total_records = len(raw_records)
        result.stats.sources_processed = [source_name]
        
        # Detect and remove duplicates
        unique_records, duplicates = detect_duplicates(raw_records)
        result.stats.duplicate_records = len(duplicates)
        
        # Process each record
        validated_records: list[ValidatedRecord] = []
        
        for raw_record in unique_records:
            try:
                validated = self._validate_and_transform(raw_record, source_name)
                if validated:
                    validated_records.append(validated)
                    result.stats.valid_records += 1
                else:
                    result.stats.filtered_records += 1
            except Exception as e:
                result.stats.invalid_records += 1
                result.errors.append(f"Validation error: {e}")
        
        result.data = validated_records
        return result
    
    def _validate_and_transform(
        self,
        raw_record: dict,
        source_name: str
    ) -> Optional[ValidatedRecord]:
        """
        Validate and transform a raw record into a validated record.
        
        Args:
            raw_record: Raw record dictionary
            source_name: Source identifier
            
        Returns:
            ValidatedRecord or None if validation fails
        """
        # Map common field names to our schema
        field_mapping = {
            "crop_name": ["crop", "commodity", "commodity_name", "cropName", "Commodity"],
            "mandi_name": ["mandi", "market", "market_name", "mandiName", "Market"],
            "state_name": ["state", "state_name", "stateName", "State"],
            "date": ["date", "arrival_date", "date_str", "Date"],
            "min_price": ["min_price", "minPrice", "minimum_price", "MinPrice"],
            "max_price": ["max_price", "maxPrice", "maximum_price", "MaxPrice"],
            "modal_price": ["modal_price", "modalPrice", "ModalPrice"],
            "unit": ["unit", "Unit", "price_unit"],
            "arrival": ["arrival", "arrivals", "quantity", "arrival_quantity"],
        }
        
        # Extract values using field mapping
        record_data: dict = {}
        for target_field, source_fields in field_mapping.items():
            for source_field in source_fields:
                if source_field in raw_record and raw_record[source_field] is not None:
                    record_data[target_field] = raw_record[source_field]
                    break
        
        # Set source if not present
        if "source" not in record_data:
            record_data["source"] = source_name
        
        # Validate required fields
        if "crop_name" not in record_data or not record_data["crop_name"]:
            return None
        if "mandi_name" not in record_data or not record_data["mandi_name"]:
            return None
        if "date" not in record_data or not record_data["date"]:
            return None
        
        # Parse and normalize date
        parsed_date = normalize_date(str(record_data["date"]))
        if not parsed_date:
            return None
        
        # Parse prices
        unit = normalize_unit(record_data.get("unit"))
        
        min_price = parse_price(record_data.get("min_price"))
        max_price = parse_price(record_data.get("max_price"))
        modal_price = parse_price(record_data.get("modal_price"))
        
        # Normalize prices to quintal
        min_price_norm = normalize_price(min_price, unit) if min_price else None
        max_price_norm = normalize_price(max_price, unit) if max_price else None
        modal_price_norm = normalize_price(modal_price, unit) if modal_price else None
        
        # Parse arrival
        arrival = parse_price(record_data.get("arrival"))
        
        # Clean strings
        crop_name = clean_string(record_data.get("crop_name", ""))
        mandi_name = clean_string(record_data.get("mandi_name", ""))
        state_name = clean_string(record_data.get("state_name"))
        
        if not crop_name or not mandi_name:
            return None
        
        # Create validated record
        validated = ValidatedRecord(
            crop_name=crop_name,
            mandi_name=mandi_name,
            state_name=state_name,
            date=parsed_date,
            min_price=min_price_norm,
            max_price=max_price_norm,
            modal_price=modal_price_norm,
            unit="quintal",  # All prices normalized to quintal
            arrival=arrival,
            source=record_data.get("source", source_name),
            raw_data=raw_record,
        )
        
        return validated
    
    def load_all(self, date_str: str) -> dict[str, DataLoadResult]:
        """
        Load data from all available sources for a date.
        
        Args:
            date_str: Date string in YYYY-MM-DD format
            
        Returns:
            Dictionary mapping source names to their DataLoadResults
        """
        sources = self.get_available_sources()
        results: dict[str, DataLoadResult] = {}
        
        for source in sources:
            result = self.load_source(source, date_str)
            results[source] = result
        
        return results
    
    def get_available_sources(self) -> list[str]:
        """
        List all sources with available data.
        
        Returns:
            List of source directory names
        """
        if not self.data_path.exists():
            return []
        
        sources = []
        for item in self.data_path.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                sources.append(item.name)
        
        return sorted(sources)
    
    def get_available_dates(self, source: str) -> list[str]:
        """
        List all dates available for a source.
        
        Args:
            source: Source name
            
        Returns:
            List of date strings (YYYY-MM-DD)
        """
        source_path = self._get_source_path(source)
        
        if not source_path.exists():
            return []
        
        dates = []
        for file_path in source_path.glob("*.json"):
            # Extract date from filename (YYYY-MM-DD.json)
            date_str = file_path.stem
            dates.append(date_str)
        
        return sorted(dates)
    
    def aggregate_sources(
        self,
        date_str: str,
        sources: Optional[list[str]] = None
    ) -> DataLoadResult:
        """
        Load and aggregate data from multiple sources.
        
        Args:
            date_str: Date string
            sources: List of sources to aggregate (None = all available)
            
        Returns:
            Aggregated DataLoadResult
        """
        if sources is None:
            sources = self.get_available_sources()
        
        aggregated = DataLoadResult(date=date_str)
        all_records: list[ValidatedRecord] = []
        
        for source in sources:
            result = self.load_source(source, date_str)
            all_records.extend(result.data)
            
            # Aggregate stats
            aggregated.stats.total_records += result.stats.total_records
            aggregated.stats.valid_records += result.stats.valid_records
            aggregated.stats.invalid_records += result.stats.invalid_records
            aggregated.stats.duplicate_records += result.stats.duplicate_records
            aggregated.stats.filtered_records += result.stats.filtered_records
            aggregated.stats.sources_processed.extend(result.stats.sources_processed)
            aggregated.errors.extend(result.errors)
        
        aggregated.data = all_records
        return aggregated
