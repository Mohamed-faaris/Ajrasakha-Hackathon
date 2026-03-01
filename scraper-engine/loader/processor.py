"""
Data processing utilities for date parsing, price normalization, string cleaning,
and duplicate detection.
"""

from __future__ import annotations

import re
import hashlib
from datetime import date, datetime
from typing import Optional
from decimal import Decimal, ROUND_HALF_UP


# Date formats to try when parsing
INDIAN_DATE_FORMATS = [
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%d-%b-%Y",
    "%d %b %Y",
    "%Y-%m-%d",
    "%d.%m.%Y",
    "%d-%m-%y",
    "%d/%m/%y",
    "%Y/%m/%d",
    "%d-%B-%Y",
    "%d %B %Y",
]


def normalize_date(date_str: str) -> Optional[date]:
    """
    Parse and normalize date string to date object.
    
    Tries multiple Indian date formats and returns the first successful parse.
    
    Args:
        date_str: Date string in various formats
        
    Returns:
        date object or None if parsing fails
    """
    if not date_str or not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    
    # Try each format
    for fmt in INDIAN_DATE_FORMATS:
        try:
            parsed = datetime.strptime(date_str, fmt).date()
            # Handle 2-digit years (assume 2000s for years < 50)
            if parsed.year < 50:
                parsed = parsed.replace(year=parsed.year + 2000)
            elif parsed.year < 100:
                parsed = parsed.replace(year=parsed.year + 1900)
            return parsed
        except ValueError:
            continue
    
    return None


def parse_price(price_value) -> Optional[float]:
    """
    Parse a price value from various input types.
    
    Args:
        price_value: Price as string, int, float, or None
        
    Returns:
        Float price or None
    """
    if price_value is None:
        return None
    
    if isinstance(price_value, (int, float)):
        return float(price_value) if price_value >= 0 else None
    
    if isinstance(price_value, str):
        # Remove currency symbols, commas, and whitespace
        cleaned = re.sub(r'[^\d.]', '', price_value.strip())
        if not cleaned:
            return None
        try:
            price = float(cleaned)
            return price if price >= 0 else None
        except ValueError:
            return None
    
    return None


def normalize_price(
    price: Optional[float],
    from_unit: str,
    to_unit: str = "quintal"
) -> Optional[float]:
    """
    Normalize price to a standard unit.
    
    Conversion factors:
    - 1 quintal = 100 kg
    - 1 ton = 10 quintals = 1000 kg
    
    Args:
        price: Price value
        from_unit: Original unit (quintal, kg, ton, etc.)
        to_unit: Target unit (default: quintal)
        
    Returns:
        Normalized price or None
    """
    if price is None:
        return None
    
    # Normalize unit names
    unit_map = {
        "q": "quintal",
        "qtl": "quintal",
        "quintals": "quintal",
        "quintal": "quintal",
        "kg": "kg",
        "kgs": "kg",
        "kilogram": "kg",
        "kilograms": "kg",
        "ton": "ton",
        "tons": "ton",
        "tonne": "ton",
        "tonnes": "ton",
        "mt": "ton",
    }
    
    from_unit_norm = unit_map.get(from_unit.lower().strip(), from_unit.lower().strip())
    to_unit_norm = unit_map.get(to_unit.lower().strip(), to_unit.lower().strip())
    
    if from_unit_norm == to_unit_norm:
        return price
    
    # Convert to quintal as intermediate
    conversion_to_quintal = {
        "quintal": 1.0,
        "kg": 0.01,  # 1 kg = 0.01 quintal
        "ton": 10.0,  # 1 ton = 10 quintals
    }
    
    # Convert from source to quintal
    if from_unit_norm not in conversion_to_quintal:
        return price  # Unknown unit, return as-is
    
    price_in_quintal = price * conversion_to_quintal[from_unit_norm]
    
    # Convert from quintal to target
    if to_unit_norm not in conversion_to_quintal:
        return price_in_quintal  # Unknown target, return quintal
    
    return price_in_quintal / conversion_to_quintal[to_unit_norm]


def normalize_unit(unit: Optional[str]) -> str:
    """
    Normalize unit string to standard format.
    
    Args:
        unit: Raw unit string
        
    Returns:
        Normalized unit string
    """
    if not unit:
        return "quintal"
    
    unit_map = {
        "q": "quintal",
        "qtl": "quintal",
        "quintals": "quintal",
        "quintal": "quintal",
        "kg": "kg",
        "kgs": "kg",
        "kilogram": "kg",
        "kilograms": "kg",
        "ton": "ton",
        "tons": "ton",
        "tonne": "ton",
        "tonnes": "ton",
        "mt": "ton",
    }
    
    return unit_map.get(unit.lower().strip(), unit.lower().strip())


def clean_string(value: Optional[str], title_case: bool = False) -> Optional[str]:
    """
    Clean and normalize a string value.
    
    Args:
        value: Input string
        title_case: Whether to convert to title case
        
    Returns:
        Cleaned string or None
    """
    if not value:
        return None
    
    # Strip whitespace and normalize internal spaces
    cleaned = " ".join(value.split())
    
    if title_case:
        cleaned = cleaned.title()
    else:
        # Normalize case: lowercase except proper nouns
        cleaned = cleaned.lower().strip()
    
    return cleaned


def generate_record_hash(record: dict) -> str:
    """
    Generate a hash for duplicate detection.
    
    Creates a hash based on key identifying fields.
    
    Args:
        record: Dictionary containing record data
        
    Returns:
        Hash string
    """
    # Key fields for duplicate detection
    key_fields = [
        record.get("crop_name", ""),
        record.get("mandi_name", ""),
        record.get("state_name", ""),
        str(record.get("date", "")),
        str(record.get("min_price", "")),
        str(record.get("max_price", "")),
        str(record.get("modal_price", "")),
    ]
    
    key_string = "|".join(key_fields).lower()
    return hashlib.md5(key_string.encode()).hexdigest()


def detect_duplicates(records: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Detect and separate duplicate records.
    
    Args:
        records: List of record dictionaries
        
    Returns:
        Tuple of (unique_records, duplicate_records)
    """
    seen_hashes: set[str] = set()
    unique_records: list[dict] = []
    duplicate_records: list[dict] = []
    
    for record in records:
        record_hash = generate_record_hash(record)
        if record_hash in seen_hashes:
            duplicate_records.append(record)
        else:
            seen_hashes.add(record_hash)
            unique_records.append(record)
    
    return unique_records, duplicate_records


def round_price(price: Optional[float], decimal_places: int = 2) -> Optional[float]:
    """
    Round price to specified decimal places.
    
    Args:
        price: Price value
        decimal_places: Number of decimal places
        
    Returns:
        Rounded price or None
    """
    if price is None:
        return None
    
    d = Decimal(str(price))
    rounded = d.quantize(Decimal(10) ** -decimal_places, rounding=ROUND_HALF_UP)
    return float(rounded)
