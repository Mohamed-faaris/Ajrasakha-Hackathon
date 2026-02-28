"""
Sources collection repository.

CRUD operations for the `sources` collection which stores
portal configurations, extraction strategies, and health metadata.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.url_utils import normalize_url


class SourcesRepo:
    """Async repository for the `sources` collection."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["sources"]

    async def find_all(self) -> list[dict[str, Any]]:
        """Return all source configurations."""
        cursor = self._col.find()
        return await cursor.to_list(length=None)

    async def find_by_id(self, source_id: str) -> dict[str, Any] | None:
        """Find a source by its _id."""
        from bson import ObjectId

        return await self._col.find_one({"_id": ObjectId(source_id)})

    async def find_by_url(self, url: str) -> dict[str, Any] | None:
        """Find a source by its entry URL (normalized)."""
        normalized = normalize_url(url)
        return await self._col.find_one({
            "$or": [
                {"entryUrl": normalized},
                {"entryUrl": url},
                {"baseUrl": normalized},
            ]
        })

    async def find_active(self) -> list[dict[str, Any]]:
        """Return sources that are not marked as BROKEN."""
        cursor = self._col.find({"healthStatus": {"$ne": "BROKEN"}})
        return await cursor.to_list(length=None)

    async def upsert(self, source: dict[str, Any]) -> str:
        """
        Insert or update a source configuration.

        Uses entryUrl as the match key. Returns the document _id as string.
        """
        entry_url = source.get("entryUrl", "")
        now = datetime.now(timezone.utc)

        result = await self._col.update_one(
            {"entryUrl": entry_url},
            {
                "$set": {
                    **source,
                    "updatedAt": now,
                },
                "$setOnInsert": {
                    "createdAt": now,
                },
            },
            upsert=True,
        )

        if result.upserted_id:
            return str(result.upserted_id)

        doc = await self._col.find_one({"entryUrl": entry_url})
        return str(doc["_id"]) if doc else ""

    async def update_health(
        self,
        source_id: str,
        status: str,
        *,
        last_success: datetime | None = None,
        error_message: str = "",
    ) -> None:
        """Update the health status of a source."""
        from bson import ObjectId

        update: dict[str, Any] = {
            "healthStatus": status,
            "healthUpdatedAt": datetime.now(timezone.utc),
        }
        if last_success:
            update["lastSuccessAt"] = last_success
        if error_message:
            update["lastError"] = error_message

        await self._col.update_one(
            {"_id": ObjectId(source_id)},
            {"$set": update},
        )

    async def update_extraction_config(
        self,
        source_id: str,
        extraction_type: str,
        config_data: dict[str, Any],
    ) -> None:
        """
        Update the extraction configuration after discovery.

        Saves endpoint, schemaMapping, htmlMapping, etc.
        """
        from bson import ObjectId

        await self._col.update_one(
            {"_id": ObjectId(source_id)},
            {
                "$set": {
                    "extractionType": extraction_type,
                    **config_data,
                    "discoveredAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc),
                }
            },
        )
