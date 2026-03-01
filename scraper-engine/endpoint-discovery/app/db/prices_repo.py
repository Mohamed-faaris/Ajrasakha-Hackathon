"""
Prices collection repository.

Handles bulk inserts of normalized price records plus
upserts for the derived crops, states, and mandis collections
that the Express API serves to the frontend.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class PricesRepo:
    """Async repository for prices and related entity collections."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._prices = db["prices"]
        self._crops = db["crops"]
        self._states = db["states"]
        self._mandis = db["mandis"]

    # ── Prices ───────────────────────────────────────────────────────────

    async def bulk_insert(self, records: list[dict[str, Any]]) -> int:
        """
        Insert multiple price records.

        Skips duplicates by checking (cropName, mandiName, date) uniqueness.
        Returns the number of newly inserted documents.
        """
        if not records:
            return 0

        now = datetime.now(timezone.utc)
        for rec in records:
            rec.setdefault("createdAt", now)
            rec.setdefault("updatedAt", now)

        # Use ordered=False so one duplicate doesn't abort the batch
        try:
            result = await self._prices.insert_many(records, ordered=False)
            return len(result.inserted_ids)
        except Exception:
            # BulkWriteError on duplicates -- count what did get inserted
            # by checking inserted_count from the exception details
            import pymongo.errors

            try:
                result = await self._prices.insert_many(records, ordered=False)
                return len(result.inserted_ids)
            except pymongo.errors.BulkWriteError as bwe:
                return bwe.details.get("nInserted", 0)

    async def find_by_filters(
        self,
        *,
        crop_name: str | None = None,
        state_name: str | None = None,
        mandi_name: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        source: str | None = None,
        limit: int = 100,
        skip: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        """
        Query prices with optional filters.

        Returns (records, total_count).
        """
        query: dict[str, Any] = {}
        if crop_name:
            query["cropName"] = {"$regex": crop_name, "$options": "i"}
        if state_name:
            query["stateName"] = {"$regex": state_name, "$options": "i"}
        if mandi_name:
            query["mandiName"] = {"$regex": mandi_name, "$options": "i"}
        if source:
            query["source"] = source
        if date_from or date_to:
            date_q: dict[str, str] = {}
            if date_from:
                date_q["$gte"] = date_from
            if date_to:
                date_q["$lte"] = date_to
            query["date"] = date_q

        total = await self._prices.count_documents(query)
        cursor = (
            self._prices.find(query)
            .sort("date", -1)
            .skip(skip)
            .limit(limit)
        )
        records = await cursor.to_list(length=limit)
        return records, total

    async def find_latest_date(self, source_id: str = "") -> str | None:
        """Find the most recent date in the prices collection."""
        query: dict[str, Any] = {}
        if source_id:
            query["sourceId"] = source_id

        doc = await self._prices.find_one(
            query,
            sort=[("date", -1)],
            projection={"date": 1},
        )
        return doc["date"] if doc else None

    # ── Entity Upserts ───────────────────────────────────────────────────
    # These keep crops/states/mandis collections in sync with scraped data,
    # so the Express server can serve /crops, /states, /mandis endpoints.

    async def upsert_entities_from_prices(
        self, records: list[dict[str, Any]]
    ) -> dict[str, int]:
        """
        Extract unique crops, states, and mandis from price records
        and upsert them into their respective collections.

        Returns counts of upserted entities.
        """
        crops_seen: dict[str, dict] = {}
        states_seen: dict[str, dict] = {}
        mandis_seen: dict[str, dict] = {}

        for rec in records:
            crop_name = rec.get("cropName", "")
            state_name = rec.get("stateName", "")
            mandi_name = rec.get("mandiName", "")

            if crop_name and crop_name not in crops_seen:
                crops_seen[crop_name] = {
                    "name": crop_name,
                    "commodityGroup": rec.get("commodityGroup", ""),
                }

            if state_name and state_name not in states_seen:
                states_seen[state_name] = {
                    "name": state_name,
                    "code": rec.get("stateCode", ""),
                }

            if mandi_name and mandi_name not in mandis_seen:
                mandis_seen[mandi_name] = {
                    "name": mandi_name,
                    "stateName": state_name,
                    "latitude": rec.get("latitude", 0),
                    "longitude": rec.get("longitude", 0),
                }

        now = datetime.now(timezone.utc)
        counts = {"crops": 0, "states": 0, "mandis": 0}

        for name, data in crops_seen.items():
            result = await self._crops.update_one(
                {"name": name},
                {"$set": {**data, "updatedAt": now}, "$setOnInsert": {"createdAt": now}},
                upsert=True,
            )
            if result.upserted_id:
                counts["crops"] += 1

        for name, data in states_seen.items():
            result = await self._states.update_one(
                {"name": name},
                {"$set": {**data, "updatedAt": now}, "$setOnInsert": {"createdAt": now}},
                upsert=True,
            )
            if result.upserted_id:
                counts["states"] += 1

        for name, data in mandis_seen.items():
            result = await self._mandis.update_one(
                {"name": name, "stateName": data["stateName"]},
                {"$set": {**data, "updatedAt": now}, "$setOnInsert": {"createdAt": now}},
                upsert=True,
            )
            if result.upserted_id:
                counts["mandis"] += 1

        return counts

    async def ensure_indexes(self) -> None:
        """Create indexes for efficient querying."""
        await self._prices.create_index([("date", -1)])
        await self._prices.create_index([("cropName", 1), ("mandiName", 1), ("date", -1)])
        await self._prices.create_index([("stateName", 1)])
        await self._prices.create_index([("source", 1)])
        await self._crops.create_index([("name", 1)], unique=True)
        await self._states.create_index([("name", 1)], unique=True)
        await self._mandis.create_index(
            [("name", 1), ("stateName", 1)], unique=True
        )
