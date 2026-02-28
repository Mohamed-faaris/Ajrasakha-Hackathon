"""
Database output adapter.

Saves normalized prices, source configs, and run logs to MongoDB.
"""

from __future__ import annotations

import logging
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.prices_repo import PricesRepo
from app.db.runs_repo import RunsRepo
from app.db.sources_repo import SourcesRepo

logger = logging.getLogger("mandi-agent")


class DbOutput:
    """Save scrape results to MongoDB."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._prices_repo = PricesRepo(db)
        self._runs_repo = RunsRepo(db)
        self._sources_repo = SourcesRepo(db)

    async def save_prices(self, records: list[dict[str, Any]]) -> int:
        """
        Save normalized price records to the prices collection.

        Also upserts derived entities (crops, states, mandis).
        Returns the number of inserted records.
        """
        if not records:
            return 0

        # Ensure indexes exist (idempotent)
        await self._prices_repo.ensure_indexes()

        # Insert prices
        inserted = await self._prices_repo.bulk_insert(records)
        logger.info("Inserted %d price records (of %d provided)", inserted, len(records))

        # Upsert derived entities
        entity_counts = await self._prices_repo.upsert_entities_from_prices(records)
        if any(entity_counts.values()):
            logger.info(
                "Upserted entities: %d crops, %d states, %d mandis",
                entity_counts["crops"],
                entity_counts["states"],
                entity_counts["mandis"],
            )

        return inserted

    async def save_source_config(self, config: dict[str, Any]) -> str:
        """Save or update a source configuration. Returns source _id."""
        return await self._sources_repo.upsert(config)

    async def save_run(self, run_doc: dict[str, Any]) -> str:
        """Save a run log document. Returns the run _id."""
        return await self._runs_repo.insert_run(run_doc)

    async def update_source_health(
        self,
        source_id: str,
        status: str,
        **kwargs: Any,
    ) -> None:
        """Update health status for a source."""
        await self._sources_repo.update_health(source_id, status, **kwargs)

    async def update_extraction_config(
        self,
        source_id: str,
        extraction_type: str,
        config_data: dict[str, Any],
    ) -> None:
        """Save discovery results (extraction config) to a source."""
        await self._sources_repo.update_extraction_config(
            source_id, extraction_type, config_data
        )
