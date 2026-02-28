"""
Discovery engine orchestrator.

Takes a source entry URL, crawls it with Playwright, feeds discovered
URLs into the multi-level priority queue, and runs all detectors
(network sniffer, table detector, file detector) on each page.

Produces a DiscoveryResult that the AI discovery mode will analyze.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

from playwright.async_api import async_playwright

from app.core.constants import MAX_CRAWL_DEPTH
from app.core.context import RunContext
from app.discovery.crawler import create_browser_context, navigate_and_extract
from app.discovery.file_detector import detect_files
from app.discovery.network_sniffer import NetworkSniffer
from app.discovery.table_detector import detect_tables
from app.queue.multi_level_queue import MultiLevelQueue
from app.queue.scoring import score_url
from app.utils.url_utils import extract_base_url

logger = logging.getLogger("mandi-agent")


@dataclass
class DiscoveryResult:
    """Aggregated results from the discovery pipeline."""

    source_url: str = ""
    base_url: str = ""

    # All discovered pages with metadata
    pages_visited: list[dict[str, Any]] = field(default_factory=list)

    # Candidates by type
    api_candidates: list[dict[str, Any]] = field(default_factory=list)
    table_candidates: list[dict[str, Any]] = field(default_factory=list)
    file_candidates: list[dict[str, Any]] = field(default_factory=list)

    # Queue stats
    queue_stats: dict[str, Any] = field(default_factory=dict)

    # Errors during discovery
    errors: list[dict[str, str]] = field(default_factory=list)

    @property
    def has_candidates(self) -> bool:
        """Check if any candidates were found."""
        return bool(self.api_candidates or self.table_candidates or self.file_candidates)

    def best_api_candidate(self) -> dict[str, Any] | None:
        """Return the highest-scored API candidate."""
        if not self.api_candidates:
            return None
        return max(self.api_candidates, key=lambda c: c.get("relevance_score", 0))

    def best_table_candidate(self) -> dict[str, Any] | None:
        """Return the highest-scored table candidate."""
        if not self.table_candidates:
            return None
        return max(self.table_candidates, key=lambda c: c.get("score", 0))

    def to_ai_context(self) -> dict[str, Any]:
        """
        Serialize discovery results into a dict suitable for AI analysis.

        Limits data to avoid exceeding LLM context windows.
        """
        return {
            "source_url": self.source_url,
            "base_url": self.base_url,
            "pages_visited_count": len(self.pages_visited),
            "pages_summary": [
                {
                    "url": p["url"],
                    "title": p.get("title", ""),
                    "links_count": len(p.get("links", [])),
                    "has_tables": p.get("has_tables", False),
                    "has_files": p.get("has_files", False),
                }
                for p in self.pages_visited[:20]
            ],
            "api_candidates": self.api_candidates[:5],
            "table_candidates": [
                {
                    "page_url": t.get("page_url", ""),
                    "selector": t.get("selector", ""),
                    "headers": t.get("headers", []),
                    "row_count": t.get("row_count", 0),
                    "score": t.get("score", 0),
                    "sample_rows": t.get("sample_rows", [])[:2],
                }
                for t in self.table_candidates[:5]
            ],
            "file_candidates": self.file_candidates[:5],
        }


async def run_discovery(
    ctx: RunContext,
    entry_url: str,
    *,
    max_pages: int | None = None,
) -> DiscoveryResult:
    """
    Run the full discovery pipeline for a single source URL.

    1. Create Playwright browser
    2. Navigate to entry URL, extract links
    3. Feed links into priority queue
    4. Process queue: navigate, sniff network, detect tables/files
    5. Return aggregated DiscoveryResult
    """
    if max_pages is None:
        max_pages = ctx.config.max_pages_per_source

    base_url = extract_base_url(entry_url)
    result = DiscoveryResult(source_url=entry_url, base_url=base_url)

    queue = MultiLevelQueue(max_depth=MAX_CRAWL_DEPTH)
    sniffer = NetworkSniffer()

    # Seed the queue with the entry URL
    entry_level = score_url(entry_url)
    queue.push(entry_url, entry_level, depth=0)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=ctx.config.headless)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 720},
        )
        page = await context.new_page()

        # Attach network sniffer
        sniffer.attach(page)

        pages_processed = 0

        try:
            while not queue.is_empty() and pages_processed < max_pages:
                item = queue.pop()
                if item is None:
                    break

                url = item.url
                depth = item.depth

                ctx.logger.info(
                    "Discovery [%d/%d] L%d d=%d: %s",
                    pages_processed + 1,
                    max_pages,
                    item.level,
                    depth,
                    url,
                )
                ctx.mark_visited(url)

                # Navigate and extract
                page_data = await navigate_and_extract(
                    page,
                    url,
                    base_url,
                    timeout_ms=ctx.config.discovery_timeout_seconds * 1000,
                )

                if page_data.get("error"):
                    result.errors.append({"url": url, "error": page_data["error"]})
                    ctx.add_error(url, page_data["error"])
                    continue

                # Detect tables on this page
                tables = await detect_tables(page)
                page_data["has_tables"] = bool(tables)
                for t in tables:
                    t["page_url"] = url
                result.table_candidates.extend(tables)

                # Detect downloadable files
                files = await detect_files(page, base_url)
                page_data["has_files"] = bool(files)
                for f in files:
                    f["page_url"] = url
                result.file_candidates.extend(files)

                result.pages_visited.append(page_data)
                pages_processed += 1

                # Feed discovered links into the queue
                for link in page_data.get("links", []):
                    link_url = link["url"]
                    link_level = score_url(link_url)
                    queue.push(
                        link_url,
                        link_level,
                        depth=depth + 1,
                        parent_url=url,
                    )

                # Small delay to be polite
                await asyncio.sleep(ctx.config.request_delay_ms / 1000)

        except Exception as exc:
            ctx.add_error(entry_url, f"Discovery engine error: {exc}", fatal=True)
            logger.exception("Discovery engine error")
        finally:
            sniffer.detach(page)
            await browser.close()

    # Collect API candidates from the sniffer
    result.api_candidates = sniffer.candidates

    # Sort all candidates by score
    result.api_candidates.sort(
        key=lambda c: c.get("relevance_score", 0), reverse=True
    )
    result.table_candidates.sort(
        key=lambda c: c.get("score", 0), reverse=True
    )
    result.file_candidates.sort(
        key=lambda c: c.get("score", 0), reverse=True
    )

    result.queue_stats = queue.stats()

    ctx.logger.info(
        "Discovery complete: %d pages, %d APIs, %d tables, %d files",
        len(result.pages_visited),
        len(result.api_candidates),
        len(result.table_candidates),
        len(result.file_candidates),
    )

    return result
