"""
Scrape engine orchestrator.

Reads the source config, dispatches to the correct scraper
(API, HTML table, or file), passes raw data through the normalizer,
and returns clean records ready for storage.
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.context import RunContext
from app.scraping.normalizer import normalize_records

logger = logging.getLogger("mandi-agent")


async def run_scrape(
    ctx: RunContext,
    source: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Execute a scrape for a single source based on its config.

    Dispatches to the appropriate scraper based on extractionType,
    then normalizes the output.

    Returns a list of normalized price record dicts.
    """
    extraction_type = source.get("extractionType", "")
    source_url = source.get("entryUrl", "")
    source_id = str(source.get("_id", ""))
    source_name = source.get("name", source.get("source", "other"))

    ctx.source_id = source_id
    ctx.source_url = source_url

    if not extraction_type:
        ctx.add_error(source_url, "No extractionType configured — needs discovery", fatal=True)
        return []

    ctx.logger.info("Scraping %s via %s", source_url, extraction_type)

    # ── Dispatch to the correct scraper ─────────────────────────────────

    raw_records: list[dict[str, Any]] = []

    if extraction_type == "api":
        raw_records = await _scrape_api(ctx, source)
    elif extraction_type == "html_table":
        raw_records = await _scrape_html(ctx, source)
    elif extraction_type == "pdf_excel":
        raw_records = await _scrape_file(ctx, source)
    else:
        ctx.add_error(
            source_url,
            f"Unknown extractionType: {extraction_type}",
            fatal=True,
        )
        return []

    ctx.records_extracted = len(raw_records)

    if not raw_records:
        ctx.add_error(source_url, "Scraper returned 0 records")
        return []

    # ── Normalize ───────────────────────────────────────────────────────

    schema_mapping = source.get("schemaMapping", {})
    conversions = source.get("conversions", {})

    if schema_mapping:
        normalized = normalize_records(
            raw_records,
            schema_mapping,
            conversions,
            source_id=source_id,
            source_name=source_name,
        )
    else:
        ctx.logger.warning("No schemaMapping for %s — returning raw records", source_url)
        normalized = raw_records

    ctx.logger.info(
        "Scrape complete: %d raw → %d normalized records",
        len(raw_records),
        len(normalized),
    )

    return normalized


# ── Private Dispatchers ──────────────────────────────────────────────────────


async def _scrape_api(ctx: RunContext, source: dict[str, Any]) -> list[dict[str, Any]]:
    """Dispatch to API scraper."""
    from app.scraping.api_scraper import scrape_api

    endpoint = source.get("endpoint", "")
    if not endpoint:
        ctx.add_error(source["entryUrl"], "No API endpoint configured")
        return []

    return await scrape_api(
        ctx,
        endpoint,
        method=source.get("endpointMethod", "GET"),
        params=source.get("endpointParams", {}),
        headers=source.get("endpointHeaders", {}),
        post_data=source.get("endpointPostData"),
        post_content_type=source.get("postContentType", "json"),
        paginate=source.get("paginate", True),
    )


async def _scrape_html(ctx: RunContext, source: dict[str, Any]) -> list[dict[str, Any]]:
    """Dispatch to HTML table scraper."""
    from app.scraping.html_scraper import scrape_html_table

    page_url = source.get("htmlPageUrl") or source.get("entryUrl", "")
    selector = source.get("htmlSelector", "")

    return await scrape_html_table(
        ctx,
        page_url,
        selector=selector,
    )


async def _scrape_file(ctx: RunContext, source: dict[str, Any]) -> list[dict[str, Any]]:
    """Dispatch to file scraper."""
    from app.scraping.file_scraper import scrape_file

    file_url = source.get("fileUrl", "")
    if not file_url:
        ctx.add_error(source["entryUrl"], "No file URL configured")
        return []

    return await scrape_file(
        ctx,
        file_url,
        file_type=source.get("fileType", ""),
    )
