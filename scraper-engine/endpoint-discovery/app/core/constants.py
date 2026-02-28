"""
Constants: keywords, thresholds, and unified schema definitions.
"""

from __future__ import annotations

# ── Queue Priority Keywords ──────────────────────────────────────────────────
# Used by app.queue.scoring to assign priority levels to discovered URLs.

LEVEL_0_KEYWORDS: frozenset[str] = frozenset({
    "api",
    "mandi",
    "price",
    "rate",
    "report",
    "commodity",
    "market",
    "apmc",
    "agmarknet",
    "arrivals",
})

LEVEL_1_KEYWORDS: frozenset[str] = frozenset({
    "market-watch",
    "daily",
    "bulletin",
    "rates-today",
    "today",
    "current",
    "latest",
    "live",
    "wholesale",
    "retail",
})

LEVEL_2_KEYWORDS: frozenset[str] = frozenset()  # catch-all for internal links

LEVEL_3_KEYWORDS: frozenset[str] = frozenset({
    "archive",
    "download",
    "old",
    "history",
    "previous",
    "past",
    "annual",
    "yearly",
})

# ── Network Sniffing ────────────────────────────────────────────────────────

# Content types that indicate JSON API responses worth capturing
JSON_CONTENT_TYPES: frozenset[str] = frozenset({
    "application/json",
    "text/json",
})

# Minimum number of records in a JSON response to consider it a data endpoint
MIN_API_RECORDS: int = 3

# ── File Detection ──────────────────────────────────────────────────────────

DOWNLOADABLE_EXTENSIONS: frozenset[str] = frozenset({
    ".pdf",
    ".xlsx",
    ".xls",
    ".csv",
})

# ── Discovery Thresholds ────────────────────────────────────────────────────

# Minimum AI confidence score to accept a discovery result
MIN_DISCOVERY_CONFIDENCE: float = 0.6

# Maximum depth of internal link crawling from the entry URL
MAX_CRAWL_DEPTH: int = 3

# ── Extraction Priority ────────────────────────────────────────────────────

# Preferred extraction types, ordered by priority (API first)
EXTRACTION_PRIORITY: list[str] = ["api", "html_table", "pdf_excel"]

# ── Unified Schema Fields ───────────────────────────────────────────────────
# The normalized Price record must contain these fields.
# Matches shared/types/index.ts → Price interface.

UNIFIED_PRICE_FIELDS: list[str] = [
    "cropId",
    "cropName",
    "mandiId",
    "mandiName",
    "stateId",
    "stateName",
    "date",
    "minPrice",
    "maxPrice",
    "modalPrice",
    "unit",
    "arrival",
    "source",
]

# Default unit for price normalization
DEFAULT_PRICE_UNIT: str = "quintal"

# ── Common Indian Date Formats ──────────────────────────────────────────────

INDIAN_DATE_FORMATS: list[str] = [
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%d-%b-%Y",
    "%d %b %Y",
    "%Y-%m-%d",
    "%d.%m.%Y",
    "%d-%m-%y",
    "%d/%m/%y",
]

# ── Health Status Values ────────────────────────────────────────────────────

HEALTH_OK: str = "OK"
HEALTH_STALE: str = "STALE"
HEALTH_BROKEN: str = "BROKEN"

# Hours after which a source with no new data is considered stale
STALE_THRESHOLD_HOURS: int = 48
