"""
Playwright crawler.

Navigates to URLs, extracts all internal links, and provides
page content for downstream detectors.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any
from urllib.parse import urljoin

from playwright.async_api import Page, async_playwright

from app.utils.url_utils import is_internal_link, normalize_url

logger = logging.getLogger("mandi-agent")


async def extract_links(page: Page, base_url: str) -> list[dict[str, str]]:
    """
    Extract all anchor links from the current page.

    Returns a list of dicts with keys: url, text, href (original).
    Only includes internal links.
    """
    raw_links = await page.evaluate("""
        () => {
            const anchors = document.querySelectorAll('a[href]');
            return Array.from(anchors).map(a => ({
                href: a.getAttribute('href'),
                text: (a.textContent || '').trim().substring(0, 200),
            }));
        }
    """)

    links: list[dict[str, str]] = []
    seen: set[str] = set()

    for item in raw_links:
        href = item.get("href", "")
        if not href or href.startswith("#") or href.startswith("javascript:"):
            continue
        if href.startswith("mailto:") or href.startswith("tel:"):
            continue

        absolute = urljoin(base_url, href)
        normalized = normalize_url(absolute)

        if normalized in seen:
            continue
        if not is_internal_link(normalized, base_url):
            continue

        seen.add(normalized)
        links.append({
            "url": normalized,
            "text": item.get("text", ""),
            "href": href,
        })

    return links


async def navigate_and_extract(
    page: Page,
    url: str,
    base_url: str,
    *,
    timeout_ms: int = 30000,
    wait_for: str = "domcontentloaded",
) -> dict[str, Any]:
    """
    Navigate to a URL and extract page data.

    Returns a dict with:
      - url: the final URL after redirects
      - title: page title
      - links: list of internal link dicts
      - html_snippet: first 5000 chars of body HTML (for AI context)
      - status: HTTP status code
      - error: error message if navigation failed
    """
    result: dict[str, Any] = {
        "url": url,
        "title": "",
        "links": [],
        "html_snippet": "",
        "status": 0,
        "error": "",
    }

    try:
        response = await page.goto(url, timeout=timeout_ms, wait_until=wait_for)
        if response:
            result["status"] = response.status
            result["url"] = page.url  # Final URL after redirects

        # Wait a bit for JS rendering
        await page.wait_for_timeout(1000)

        result["title"] = await page.title()
        result["links"] = await extract_links(page, base_url)

        # Grab a snippet of the body for AI analysis
        body_html = await page.evaluate(
            "() => document.body ? document.body.innerHTML.substring(0, 5000) : ''"
        )
        result["html_snippet"] = body_html

    except Exception as exc:
        result["error"] = str(exc)
        logger.debug("Navigation failed for %s: %s", url, exc)

    return result


async def create_browser_context(
    *,
    headless: bool = True,
    playwright_instance: Any = None,
) -> tuple[Any, Any, Page]:
    """
    Create a Playwright browser and page.

    Returns (browser, context, page).
    Caller is responsible for closing the browser.
    """
    if playwright_instance is None:
        pw = await async_playwright().start()
    else:
        pw = playwright_instance

    browser = await pw.chromium.launch(headless=headless)
    context = await browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ),
        viewport={"width": 1280, "height": 720},
        java_script_enabled=True,
    )
    page = await context.new_page()

    return browser, context, page
