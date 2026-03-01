"""
Scrape runs collection repository.

Stores run history logs: duration, visited URLs, record counts,
errors, and success/failure state.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class RunsRepo:
    """Async repository for the `scrape_runs` collection."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["scrape_runs"]

    async def insert_run(self, run_doc: dict[str, Any]) -> str:
        """
        Insert a completed run log document.

        Returns the inserted document's _id as a string.
        """
        run_doc.setdefault("createdAt", datetime.now(timezone.utc))
        result = await self._col.insert_one(run_doc)
        return str(result.inserted_id)

    async def find_latest(
        self,
        source_id: str,
        *,
        limit: int = 1,
    ) -> list[dict[str, Any]]:
        """Find the most recent run(s) for a given source."""
        cursor = (
            self._col.find({"sourceId": source_id})
            .sort("createdAt", -1)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def find_latest_successful(self, source_id: str) -> dict[str, Any] | None:
        """Find the most recent successful run for a source."""
        return await self._col.find_one(
            {"sourceId": source_id, "success": True},
            sort=[("createdAt", -1)],
        )

    async def find_runs_since(
        self,
        since: datetime,
        *,
        source_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """Find all runs since a given datetime, optionally filtered by source."""
        query: dict[str, Any] = {"createdAt": {"$gte": since}}
        if source_id:
            query["sourceId"] = source_id

        cursor = self._col.find(query).sort("createdAt", -1)
        return await cursor.to_list(length=None)

    async def count_recent_failures(
        self,
        source_id: str,
        *,
        last_n: int = 5,
    ) -> int:
        """Count failures in the last N runs for a source."""
        cursor = (
            self._col.find({"sourceId": source_id})
            .sort("createdAt", -1)
            .limit(last_n)
        )
        runs = await cursor.to_list(length=last_n)
        return sum(1 for r in runs if not r.get("success", False))
