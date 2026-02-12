"""
HTML table scraper.

Extracts data tables from web pages using BeautifulSoup and pandas.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
import pandas as pd
from bs4 import BeautifulSoup

from app.core.context import RunContext

logger = logging.getLogger("mandi-agent")

_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
}


async def scrape_html_table(
    ctx: RunContext,
    page_url: str,
    *,
    selector: str = "",
    table_index: int = 0,
) -> list[dict[str, Any]]:
    """
    Fetch a web page and extract a table as a list of dicts.

    Args:
        ctx: Run context.
        page_url: URL of the page containing the table.
        selector: Optional CSS selector to target a specific table.
        table_index: Index of the table to extract (if selector matches multiple).

    Returns:
        List of row dicts with column headers as keys.
    """
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            follow_redirects=True,
        ) as client:
            response = await client.get(page_url, headers=_DEFAULT_HEADERS)
            response.raise_for_status()
            html = response.text

    except httpx.HTTPError as exc:
        ctx.add_error(page_url, f"HTTP error: {exc}")
        return []

    return extract_table_from_html(
        html,
        page_url=page_url,
        selector=selector,
        table_index=table_index,
        ctx=ctx,
    )


def extract_table_from_html(
    html: str,
    *,
    page_url: str = "",
    selector: str = "",
    table_index: int = 0,
    ctx: RunContext | None = None,
) -> list[dict[str, Any]]:
    """
    Parse HTML and extract a table as a list of dicts.

    Uses pandas.read_html for robust table parsing with
    BeautifulSoup as the underlying parser.
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Find the target table
        if selector:
            target = soup.select(selector)
            if not target:
                msg = f"Selector '{selector}' not found on {page_url}"
                if ctx:
                    ctx.add_error(page_url, msg)
                logger.warning(msg)
                return []
            table_html = str(target[min(table_index, len(target) - 1)])
        else:
            tables = soup.find_all("table")
            if not tables:
                msg = f"No tables found on {page_url}"
                if ctx:
                    ctx.add_error(page_url, msg)
                logger.warning(msg)
                return []
            table_html = str(tables[min(table_index, len(tables) - 1)])

        # Use pandas for robust table parsing
        dfs = pd.read_html(
            str(table_html),
            flavor="lxml",
        )

        if not dfs:
            return []

        df = dfs[0]

        # Clean up: strip whitespace, drop all-NaN rows
        df = df.dropna(how="all")
        for col in df.select_dtypes(include=["object"]).columns:
            df[col] = df[col].astype(str).str.strip()

        records = df.to_dict(orient="records")
        logger.info(
            "Extracted %d rows from table on %s",
            len(records),
            page_url,
        )
        return records

    except Exception as exc:
        msg = f"Table extraction error: {exc}"
        if ctx:
            ctx.add_error(page_url, msg)
        logger.error(msg)
        return []
