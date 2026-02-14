"""
File detector.

Finds links to downloadable files (PDF, Excel, CSV) on a page
that may contain mandi price reports.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urljoin

from playwright.async_api import Page

from app.core.constants import DOWNLOADABLE_EXTENSIONS, LEVEL_0_KEYWORDS

logger = logging.getLogger("mandi-agent")


async def detect_files(page: Page, base_url: str) -> list[dict[str, Any]]:
    """
    Find downloadable file links on the current page.

    Returns a list of file candidates sorted by relevance score (desc).
    Each candidate contains:
      - url: absolute URL to the file
      - text: link text
      - extension: file extension (.pdf, .xlsx, etc.)
      - score: relevance score (0.0 - 1.0)
    """
    raw_links = await page.evaluate("""
        () => {
            const anchors = document.querySelectorAll('a[href]');
            return Array.from(anchors).map(a => ({
                href: a.getAttribute('href') || '',
                text: (a.textContent || '').trim().substring(0, 200),
            }));
        }
    """)

    candidates: list[dict[str, Any]] = []
    seen: set[str] = set()

    for item in raw_links:
        href = item.get("href", "").strip()
        if not href:
            continue

        # Resolve relative URLs
        absolute = urljoin(base_url, href)
        href_lower = absolute.lower()

        # Check for downloadable extensions
        extension = ""
        for ext in DOWNLOADABLE_EXTENSIONS:
            if href_lower.endswith(ext) or ext in href_lower:
                extension = ext
                break

        if not extension:
            continue

        if absolute in seen:
            continue
        seen.add(absolute)

        text = item.get("text", "")
        score = _score_file(absolute, text, extension)

        candidates.append({
            "url": absolute,
            "text": text,
            "extension": extension,
            "score": score,
        })

    # Sort by score descending
    candidates.sort(key=lambda f: f["score"], reverse=True)

    if candidates:
        logger.debug(
            "Found %d downloadable files (best score: %.2f)",
            len(candidates),
            candidates[0]["score"],
        )

    return candidates


def _score_file(url: str, text: str, extension: str) -> float:
    """
    Score a file link based on how likely it contains price data.
    """
    score = 0.0
    combined = f"{url} {text}".lower()

    # Keyword matches
    for keyword in LEVEL_0_KEYWORDS:
        if keyword in combined:
            score += 0.15

    # Date-like patterns suggest daily reports
    import re

    if re.search(r"\d{2}[-/.]\d{2}[-/.]\d{4}", combined):
        score += 0.1
    if re.search(r"daily|today|current|latest", combined):
        score += 0.1

    # Extension preference (Excel > PDF > CSV for structured data)
    ext_scores = {".xlsx": 0.15, ".xls": 0.15, ".csv": 0.1, ".pdf": 0.05}
    score += ext_scores.get(extension, 0)

    return min(score, 1.0)
