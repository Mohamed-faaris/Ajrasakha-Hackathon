"""
Single URL input adapter.

Handles the single_url agent mode:
  1. Check DB for existing config matching the URL
  2. If found → return it for scraping
  3. If not found → return a bare config for discovery
"""

from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.sources_repo import SourcesRepo
from app.utils.url_utils import extract_base_url


class SingleUrlInput:
    """Handle single_url mode source resolution."""

    def __init__(self, db: AsyncIOMotorDatabase | None, target_url: str) -> None:
        self._repo = SourcesRepo(db) if db else None
        self._target_url = target_url

    async def load_sources(self) -> list[dict[str, Any]]:
        """
        Resolve a single URL into a source config.

        Returns a list with exactly one source config dict.
        The dict includes a `_needs_discovery` flag if no existing
        config was found in the database.
        """
        if not self._target_url:
            raise ValueError("--url is required for single_url mode")

        # Try to find existing config in DB
        if self._repo:
            existing = await self._repo.find_by_url(self._target_url)
            if existing:
                existing["_needs_discovery"] = False
                return [existing]

        # No existing config → build a bare source for discovery
        return [{
            "entryUrl": self._target_url,
            "baseUrl": extract_base_url(self._target_url),
            "_needs_discovery": True,
        }]
