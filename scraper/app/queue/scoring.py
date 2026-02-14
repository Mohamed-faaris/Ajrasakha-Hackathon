"""
URL keyword scoring.

Assigns a priority level (0-3) to a URL based on keyword matching
against the URL path and query string.
"""

from __future__ import annotations

from urllib.parse import urlparse

from app.core.constants import (
    LEVEL_0_KEYWORDS,
    LEVEL_1_KEYWORDS,
    LEVEL_3_KEYWORDS,
)


def score_url(url: str) -> int:
    """
    Score a URL and return its priority level.

    Returns:
        0 = critical (highest priority)
        1 = high probability
        2 = normal internal link
        3 = deep crawl (lowest priority)
    """
    parsed = urlparse(url)
    # Combine path and query into a single searchable string
    text = f"{parsed.path} {parsed.query}".lower()

    # Check Level 0 (critical) keywords first
    for keyword in LEVEL_0_KEYWORDS:
        if keyword in text:
            return 0

    # Check Level 1 (high probability) keywords
    for keyword in LEVEL_1_KEYWORDS:
        if keyword in text:
            return 1

    # Check Level 3 (deep crawl) keywords
    for keyword in LEVEL_3_KEYWORDS:
        if keyword in text:
            return 3

    # Default: Level 2 (normal internal link)
    return 2


def score_url_with_details(url: str) -> dict:
    """
    Score a URL and return details about which keywords matched.

    Useful for debugging and AI context.
    """
    parsed = urlparse(url)
    text = f"{parsed.path} {parsed.query}".lower()

    matched_keywords: list[str] = []
    level = 2  # default

    for keyword in LEVEL_0_KEYWORDS:
        if keyword in text:
            matched_keywords.append(keyword)
            level = min(level, 0)

    if level > 0:
        for keyword in LEVEL_1_KEYWORDS:
            if keyword in text:
                matched_keywords.append(keyword)
                level = min(level, 1)

    if level > 1:
        for keyword in LEVEL_3_KEYWORDS:
            if keyword in text:
                matched_keywords.append(keyword)
                level = 3

    return {
        "url": url,
        "level": level,
        "matched_keywords": matched_keywords,
    }
