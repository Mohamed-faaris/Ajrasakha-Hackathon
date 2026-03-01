"""
Date utilities.

Parsing multiple Indian date formats, ISO conversion,
and date range helpers for price data normalization.
"""

from __future__ import annotations

from datetime import date, datetime, timezone

from app.core.constants import INDIAN_DATE_FORMATS


def parse_date(value: str | datetime | date) -> datetime | None:
    """
    Parse a date string into a datetime object.

    Tries all known Indian date formats, plus ISO 8601.
    Returns None if no format matches.
    """
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)

    if not isinstance(value, str) or not value.strip():
        return None

    text = value.strip()

    # Try ISO 8601 first (most unambiguous)
    for fmt in INDIAN_DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    # Try ISO with time component
    try:
        return datetime.fromisoformat(text).replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        pass

    return None


def to_iso_string(dt: datetime | date | None) -> str:
    """
    Convert a datetime to ISO 8601 date string (YYYY-MM-DD).

    Returns empty string if input is None.
    """
    if dt is None:
        return ""
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d")
    return dt.isoformat()


def today_iso() -> str:
    """Return today's date as ISO string (UTC)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def is_recent(dt: datetime, hours: int = 48) -> bool:
    """
    Check if a datetime is within the last N hours.

    Used for health status checks (STALE detection).
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - dt
    return delta.total_seconds() < hours * 3600


def format_date(dt: datetime | date, fmt: str = "%d-%m-%Y") -> str:
    """Format a datetime for display (default: Indian DD-MM-YYYY)."""
    return dt.strftime(fmt)
