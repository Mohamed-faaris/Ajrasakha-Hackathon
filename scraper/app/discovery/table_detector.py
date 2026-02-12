"""
HTML table detector.

Identifies and scores HTML tables on a page that may contain
mandi price data. Used during discovery to determine if
html_table extraction is viable.
"""

from __future__ import annotations

import logging
from typing import Any

from playwright.async_api import Page

from app.core.constants import LEVEL_0_KEYWORDS

logger = logging.getLogger("mandi-agent")

# Column header keywords that suggest price data
_PRICE_COLUMN_KEYWORDS = frozenset({
    "price", "rate", "modal", "min", "max",
    "commodity", "crop", "variety",
    "mandi", "market", "apmc",
    "state", "district",
    "arrival", "quantity",
    "date", "unit",
})


async def detect_tables(page: Page) -> list[dict[str, Any]]:
    """
    Find and score all HTML tables on the current page.

    Returns a list of table candidates sorted by relevance score (desc).
    Each candidate contains:
      - selector: CSS selector for the table
      - headers: list of column header texts
      - row_count: number of data rows
      - score: relevance score (0.0 - 1.0)
      - sample_rows: first 3 rows as lists of strings
    """
    tables_data = await page.evaluate("""
        () => {
            const tables = document.querySelectorAll('table');
            return Array.from(tables).map((table, idx) => {
                // Extract headers
                const headerCells = table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td');
                const headers = Array.from(headerCells).map(cell => (cell.textContent || '').trim());

                // Extract rows
                const rows = table.querySelectorAll('tbody tr, tr');
                const rowData = Array.from(rows).slice(0, 5).map(row => {
                    const cells = row.querySelectorAll('td, th');
                    return Array.from(cells).map(cell => (cell.textContent || '').trim().substring(0, 100));
                });

                // Try to get a unique selector
                const id = table.getAttribute('id');
                const className = table.getAttribute('class');
                let selector = 'table';
                if (id) {
                    selector = `table#${id}`;
                } else if (className) {
                    selector = `table.${className.split(' ')[0]}`;
                } else {
                    selector = `table:nth-of-type(${idx + 1})`;
                }

                return {
                    selector: selector,
                    headers: headers,
                    rowCount: rows.length,
                    sampleRows: rowData,
                    index: idx,
                };
            });
        }
    """)

    candidates: list[dict[str, Any]] = []

    for table in tables_data:
        headers = [h.lower() for h in table.get("headers", [])]
        row_count = table.get("rowCount", 0)

        # Skip tiny tables (likely navigation/layout)
        if row_count < 2 or len(headers) < 3:
            continue

        score = _score_table(headers, row_count)

        candidates.append({
            "selector": table["selector"],
            "headers": table["headers"],
            "row_count": row_count,
            "score": score,
            "sample_rows": table.get("sampleRows", [])[:3],
        })

    # Sort by score descending
    candidates.sort(key=lambda t: t["score"], reverse=True)

    if candidates:
        logger.debug(
            "Found %d table candidates (best score: %.2f)",
            len(candidates),
            candidates[0]["score"],
        )

    return candidates


def _score_table(headers: list[str], row_count: int) -> float:
    """
    Score a table based on how likely it contains price data.

    Considers:
      - Column header keyword matches
      - Number of rows (more = better, up to a point)
      - Number of columns
    """
    score = 0.0

    # Header keyword matches
    matched = 0
    for header in headers:
        header_lower = header.lower()
        for keyword in _PRICE_COLUMN_KEYWORDS:
            if keyword in header_lower:
                matched += 1
                break

    if headers:
        score += (matched / len(headers)) * 0.6

    # Row count bonus (more data = more likely a data table)
    if row_count >= 10:
        score += 0.2
    elif row_count >= 5:
        score += 0.1

    # Column count (price tables typically have 5-15 columns)
    col_count = len(headers)
    if 5 <= col_count <= 15:
        score += 0.1
    elif col_count > 15:
        score += 0.05

    # Bonus for having both price and commodity/market columns
    header_text = " ".join(headers)
    has_price = any(k in header_text for k in ("price", "rate", "modal"))
    has_entity = any(k in header_text for k in ("commodity", "crop", "mandi", "market"))
    if has_price and has_entity:
        score += 0.1

    return min(score, 1.0)
