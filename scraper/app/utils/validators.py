"""
Validators.

Validate source configs, price records, and schema mappings
before they enter the pipeline or database.
"""

from __future__ import annotations

from typing import Any

from app.core.constants import EXTRACTION_PRIORITY, UNIFIED_PRICE_FIELDS


# ── Source Config Validation ─────────────────────────────────────────────────


def validate_source_config(config: dict[str, Any]) -> list[str]:
    """
    Validate a source config document.

    Returns a list of error messages (empty list = valid).
    """
    errors: list[str] = []

    if not config.get("entryUrl"):
        errors.append("entryUrl is required")

    ext_type = config.get("extractionType")
    if ext_type and ext_type not in EXTRACTION_PRIORITY:
        errors.append(
            f"extractionType must be one of {EXTRACTION_PRIORITY}, got '{ext_type}'"
        )

    # If extraction type is 'api', endpoint must be present
    if ext_type == "api" and not config.get("endpoint"):
        errors.append("endpoint is required when extractionType is 'api'")

    # Schema mapping validation
    mapping = config.get("schemaMapping")
    if mapping and not isinstance(mapping, dict):
        errors.append("schemaMapping must be a dict")

    return errors


# ── Price Record Validation ──────────────────────────────────────────────────

# Fields that must be non-empty in a price record
_REQUIRED_PRICE_FIELDS = {"cropName", "mandiName", "stateName", "date", "modalPrice"}


def validate_price_record(record: dict[str, Any]) -> list[str]:
    """
    Validate a normalized price record.

    Returns a list of error messages (empty list = valid).
    """
    errors: list[str] = []

    for field in _REQUIRED_PRICE_FIELDS:
        val = record.get(field)
        if val is None or (isinstance(val, str) and not val.strip()):
            errors.append(f"Missing required field: {field}")

    # Price sanity checks
    for price_field in ("minPrice", "maxPrice", "modalPrice"):
        val = record.get(price_field)
        if val is not None:
            try:
                num = float(val)
                if num < 0:
                    errors.append(f"{price_field} cannot be negative: {val}")
            except (ValueError, TypeError):
                errors.append(f"{price_field} must be numeric: {val}")

    # Min <= Modal <= Max sanity (if all present)
    try:
        min_p = float(record.get("minPrice", 0) or 0)
        max_p = float(record.get("maxPrice", 0) or 0)
        modal_p = float(record.get("modalPrice", 0) or 0)
        if min_p and max_p and min_p > max_p:
            errors.append(f"minPrice ({min_p}) > maxPrice ({max_p})")
        if modal_p and max_p and modal_p > max_p:
            errors.append(f"modalPrice ({modal_p}) > maxPrice ({max_p})")
    except (ValueError, TypeError):
        pass  # Already caught above

    return errors


# ── Schema Mapping Validation ────────────────────────────────────────────────


def validate_schema_mapping(mapping: dict[str, str]) -> list[str]:
    """
    Validate that a schema mapping targets valid unified schema fields.

    Returns a list of error messages (empty list = valid).
    """
    errors: list[str] = []
    valid_targets = set(UNIFIED_PRICE_FIELDS)

    for source_field, target_field in mapping.items():
        if target_field not in valid_targets:
            errors.append(
                f"Mapping target '{target_field}' (from '{source_field}') "
                f"is not a valid unified schema field"
            )

    # Check that required fields are covered
    mapped_targets = set(mapping.values())
    for required in _REQUIRED_PRICE_FIELDS:
        if required not in mapped_targets:
            errors.append(f"Required field '{required}' has no source mapping")

    return errors
