"""
Network sniffer.

Attaches to Playwright's request/response events to capture
XHR and fetch API calls that may contain price data.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from playwright.async_api import Page, Request, Response

from app.core.constants import JSON_CONTENT_TYPES, LEVEL_0_KEYWORDS, MIN_API_RECORDS

logger = logging.getLogger("mandi-agent")


class NetworkSniffer:
    """
    Captures XHR/fetch network requests during page navigation.

    Attach to a Playwright page before navigation, then retrieve
    captured API candidates after the page loads.
    """

    def __init__(self) -> None:
        self._captured: list[dict[str, Any]] = []
        self._listening = False

    def attach(self, page: Page) -> None:
        """Start listening for network responses on this page."""
        if self._listening:
            return
        page.on("response", self._on_response)
        self._listening = True

    def detach(self, page: Page) -> None:
        """Stop listening for network responses."""
        page.remove_listener("response", self._on_response)
        self._listening = False

    @property
    def candidates(self) -> list[dict[str, Any]]:
        """Return captured API endpoint candidates."""
        return list(self._captured)

    def clear(self) -> None:
        """Clear all captured data."""
        self._captured.clear()

    async def _on_response(self, response: Response) -> None:
        """Handle a network response event."""
        request = response.request

        # Only interested in XHR/fetch requests
        if request.resource_type not in ("xhr", "fetch"):
            return

        # Check content type for JSON
        content_type = response.headers.get("content-type", "").lower()
        is_json = any(ct in content_type for ct in JSON_CONTENT_TYPES)
        if not is_json:
            return

        try:
            body = await response.text()
            data = json.loads(body)
        except Exception:
            return

        # Evaluate if this looks like a data endpoint
        record_count = self._count_records(data)
        relevance_score = self._score_relevance(request.url, data)

        if record_count < MIN_API_RECORDS and relevance_score < 0.3:
            return

        candidate = {
            "url": request.url,
            "method": request.method,
            "status": response.status,
            "content_type": content_type,
            "record_count": record_count,
            "relevance_score": relevance_score,
            "sample_data": self._extract_sample(data),
            "request_headers": dict(request.headers),
            "post_data": request.post_data,
        }

        self._captured.append(candidate)
        logger.debug(
            "Captured API candidate: %s (%d records, score=%.2f)",
            request.url,
            record_count,
            relevance_score,
        )

    @staticmethod
    def _count_records(data: Any) -> int:
        """Estimate the number of data records in a JSON response."""
        if isinstance(data, list):
            return len(data)
        if isinstance(data, dict):
            # Look for common array-valued keys
            for key in ("data", "records", "items", "results", "rows", "list"):
                val = data.get(key)
                if isinstance(val, list):
                    return len(val)
        return 0

    @staticmethod
    def _score_relevance(url: str, data: Any) -> float:
        """
        Score how relevant this API response is to mandi price data.

        Returns 0.0 to 1.0.
        """
        score = 0.0
        url_lower = url.lower()

        # URL keyword matches
        for keyword in LEVEL_0_KEYWORDS:
            if keyword in url_lower:
                score += 0.2

        # Check for price-like fields in the data
        price_fields = {"price", "rate", "modal", "min", "max", "commodity", "mandi", "market", "arrival"}
        data_str = json.dumps(data)[:2000].lower()
        for field in price_fields:
            if field in data_str:
                score += 0.1

        return min(score, 1.0)

    @staticmethod
    def _extract_sample(data: Any, max_items: int = 3) -> Any:
        """Extract a small sample from the data for AI analysis."""
        if isinstance(data, list):
            return data[:max_items]
        if isinstance(data, dict):
            for key in ("data", "records", "items", "results", "rows", "list"):
                val = data.get(key)
                if isinstance(val, list):
                    return {key: val[:max_items]}
        # Return truncated dict
        if isinstance(data, dict):
            items = list(data.items())[:10]
            return dict(items)
        return data
