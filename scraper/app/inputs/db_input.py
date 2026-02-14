"""
Database input adapter.

Loads source configurations from the MongoDB `sources` collection.
"""

from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.sources_repo import SourcesRepo


class DbInput:
    """Load sources from MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._repo = SourcesRepo(db)

    async def load_sources(self) -> list[dict[str, Any]]:
        """
        Return all active (non-BROKEN) source configs.

        Each dict contains at minimum:
          - _id, entryUrl, baseUrl
          - extractionType (if discovered)
          - schemaMapping (if mapped)
        """
        return await self._repo.find_active()

    async def load_all_sources(self) -> list[dict[str, Any]]:
        """Return ALL source configs including BROKEN ones."""
        return await self._repo.find_all()
