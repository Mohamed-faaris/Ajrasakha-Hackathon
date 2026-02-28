"""
Data normalizer.

Applies schemaMapping and conversions from the source config
to transform raw extracted records into the unified Price schema.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.constants import DEFAULT_PRICE_UNIT, UNIFIED_PRICE_FIELDS
from app.utils.date_utils import parse_date, to_iso_string

logger = logging.getLogger("mandi-agent")


def normalize_records(
    raw_records: list[dict[str, Any]],
    schema_mapping: dict[str, str],
    conversions: dict[str, dict[str, Any]] | None = None,
    *,
    source_id: str = "",
    source_name: str = "",
) -> list[dict[str, Any]]:
    """
    Apply schema mapping and conversions to raw records.

    Args:
        raw_records: Raw data from scraper.
        schema_mapping: Map of raw field names → unified field names.
        conversions: Conversion rules keyed by unified field name.
        source_id: Source ID to stamp on each record.
        source_name: Source name for the 'source' field.

    Returns:
        List of normalized price record dicts.
    """
    if not schema_mapping:
        logger.warning("No schema mapping provided — returning raw records")
        return raw_records

    conversions = conversions or {}
    normalized: list[dict[str, Any]] = []

    for raw in raw_records:
        record: dict[str, Any] = {}

        # Apply field mapping
        for raw_field, unified_field in schema_mapping.items():
            if raw_field in raw:
                record[unified_field] = raw[raw_field]

        # Apply conversions
        for field_name, conv in conversions.items():
            if field_name not in record:
                continue

            value = record[field_name]

            # Multiply conversion (e.g., kg → quintal)
            multiply = conv.get("multiply")
            if multiply is not None and value is not None:
                try:
                    record[field_name] = float(value) * float(multiply)
                except (ValueError, TypeError):
                    pass

            # Date format conversion
            date_format = conv.get("date_format")
            if date_format and field_name == "date":
                parsed = parse_date(str(value))
                if parsed:
                    record[field_name] = to_iso_string(parsed)

        # Normalize date field
        if "date" in record and not isinstance(record["date"], str):
            parsed = parse_date(record["date"])
            if parsed:
                record["date"] = to_iso_string(parsed)

        # Ensure date is parsed if still a string
        if "date" in record and isinstance(record["date"], str):
            parsed = parse_date(record["date"])
            if parsed:
                record["date"] = to_iso_string(parsed)

        # Normalize price fields to float
        for price_field in ("minPrice", "maxPrice", "modalPrice"):
            if price_field in record:
                try:
                    val = record[price_field]
                    if isinstance(val, str):
                        val = val.replace(",", "").strip()
                    record[price_field] = float(val) if val else 0.0
                except (ValueError, TypeError):
                    record[price_field] = 0.0

        # Normalize arrival to float
        if "arrival" in record:
            try:
                val = record["arrival"]
                if isinstance(val, str):
                    val = val.replace(",", "").strip()
                record["arrival"] = float(val) if val else None
            except (ValueError, TypeError):
                record["arrival"] = None

        # Set defaults
        record.setdefault("unit", DEFAULT_PRICE_UNIT)
        record.setdefault("source", source_name or "other")

        # Stamp source ID
        if source_id:
            record["sourceId"] = source_id

        # Generate IDs from names if not present
        if "cropId" not in record and "cropName" in record:
            record["cropId"] = _name_to_id(record["cropName"])
        if "mandiId" not in record and "mandiName" in record:
            record["mandiId"] = _name_to_id(record["mandiName"])
        if "stateId" not in record and "stateName" in record:
            record["stateId"] = _name_to_id(record["stateName"])

        # Only include records that have the minimum required fields
        if record.get("cropName") and record.get("modalPrice"):
            normalized.append(record)

    logger.info(
        "Normalized %d records from %d raw records",
        len(normalized),
        len(raw_records),
    )

    return normalized


def _name_to_id(name: str) -> str:
    """Convert a display name to a URL-safe ID."""
    return name.lower().strip().replace(" ", "-").replace(",", "")
