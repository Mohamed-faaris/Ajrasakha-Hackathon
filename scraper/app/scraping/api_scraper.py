"""
API scraper.

Replays discovered API endpoints using httpx to fetch daily
mandi price data. Handles pagination, retries, and rate limiting.
Supports both JSON and form-encoded POST bodies.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx

from app.core.context import RunContext

logger = logging.getLogger("mandi-agent")

# Default request headers
_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
}


async def scrape_api(
    ctx: RunContext,
    endpoint: str,
    *,
    method: str = "GET",
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    post_data: dict[str, Any] | None = None,
    post_content_type: str = "json",
    paginate: bool = True,
    max_pages: int = 10,
    page_param: str = "page",
    page_size_param: str = "limit",
    page_size: int = 100,
) -> list[dict[str, Any]]:
    """
    Fetch data from an API endpoint.

    Args:
        ctx: Run context.
        endpoint: API URL.
        method: HTTP method (GET or POST).
        params: Query parameters (GET) or base params.
        headers: Extra request headers.
        post_data: POST body data.
        post_content_type: "json" (application/json) or "form" (x-www-form-urlencoded).
        paginate: Whether to auto-paginate. Set False for single-request APIs.
        max_pages: Max pages to fetch when paginating.
        page_param: Name of the page parameter.
        page_size_param: Name of the page size parameter.
        page_size: Number of records per page.

    Returns:
        Flat list of record dicts.
    """
    all_records: list[dict[str, Any]] = []
    request_headers = {**_DEFAULT_HEADERS, **(headers or {})}

    total_pages = max_pages if paginate else 1

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(30.0),
        follow_redirects=True,
    ) as client:
        for page_num in range(1, total_pages + 1):
            try:
                if method.upper() == "POST":
                    body = dict(post_data or {})

                    if paginate:
                        body[page_param] = page_num
                        body[page_size_param] = page_size

                    if post_content_type == "form":
                        response = await client.post(
                            endpoint,
                            data=body,
                            headers=request_headers,
                        )
                    else:
                        response = await client.post(
                            endpoint,
                            json=body,
                            headers=request_headers,
                        )
                else:
                    req_params = dict(params or {})
                    if paginate:
                        req_params[page_param] = page_num
                        req_params[page_size_param] = page_size

                    response = await client.get(
                        endpoint,
                        params=req_params,
                        headers=request_headers,
                    )

                response.raise_for_status()
                data = response.json()

            except httpx.HTTPStatusError as exc:
                ctx.add_error(
                    endpoint,
                    f"HTTP {exc.response.status_code} on page {page_num}",
                )
                if exc.response.status_code in (403, 429):
                    ctx.logger.warning("Rate limited, waiting 5s...")
                    await asyncio.sleep(5)
                    continue
                break

            except httpx.RequestError as exc:
                ctx.add_error(endpoint, f"Request error on page {page_num}: {exc}")
                break

            except json.JSONDecodeError:
                ctx.add_error(endpoint, f"Invalid JSON on page {page_num}")
                break

            # Extract records from response
            records = _extract_records(data)

            if not records:
                ctx.logger.debug("No records on page %d — stopping pagination", page_num)
                break

            all_records.extend(records)
            ctx.logger.debug(
                "API page %d: %d records (total: %d)",
                page_num,
                len(records),
                len(all_records),
            )

            if not paginate:
                break

            # If we got fewer records than page_size, we've reached the end
            if len(records) < page_size:
                break

            # Polite delay between requests
            await asyncio.sleep(ctx.config.request_delay_ms / 1000)

    ctx.logger.info("API scrape complete: %d total records from %s", len(all_records), endpoint)
    return all_records


def _extract_records(data: Any) -> list[dict[str, Any]]:
    """
    Extract a list of records from a JSON response.

    Handles common API response structures:
      - Direct array: [...]
      - Wrapped: {"data": [...]} or {"records": [...]}
    """
    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in ("data", "records", "items", "results", "rows", "list"):
            val = data.get(key)
            if isinstance(val, list):
                return val

    return []
