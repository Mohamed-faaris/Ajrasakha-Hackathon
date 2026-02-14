"""
Health monitor.

Updates source health status based on scrape results.
  - OK: last scrape was successful and recent
  - STALE: last success is older than threshold
  - BROKEN: consecutive failures exceed limit
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.core.constants import HEALTH_BROKEN, HEALTH_OK, HEALTH_STALE, STALE_THRESHOLD_HOURS
from app.core.context import RunContext
from app.utils.date_utils import is_recent

logger = logging.getLogger("mandi-agent")


async def update_health(
    ctx: RunContext,
    source_id: str,
    *,
    success: bool,
    records_saved: int = 0,
) -> str:
    """
    Determine and update the health status of a source after a run.

    Returns the new health status string.
    """
    if ctx.db is None:
        logger.debug("No DB connection — skipping health update")
        return HEALTH_OK if success else HEALTH_BROKEN

    from app.db.runs_repo import RunsRepo
    from app.db.sources_repo import SourcesRepo

    sources_repo = SourcesRepo(ctx.db)
    runs_repo = RunsRepo(ctx.db)

    now = datetime.now(timezone.utc)

    if success and records_saved > 0:
        status = HEALTH_OK
        await sources_repo.update_health(
            source_id,
            status,
            last_success=now,
        )
        logger.info("Health: %s → %s (%d records)", source_id, status, records_saved)
        return status

    # Check recent failure count
    failure_count = await runs_repo.count_recent_failures(source_id, last_n=5)

    if failure_count >= 3:
        status = HEALTH_BROKEN
        error_msg = (
            f"{failure_count} consecutive failures in last 5 runs"
        )
    else:
        # Check if last success is stale
        last_success_run = await runs_repo.find_latest_successful(source_id)
        if last_success_run:
            last_success_time = last_success_run.get("createdAt", now)
            if is_recent(last_success_time, hours=STALE_THRESHOLD_HOURS):
                status = HEALTH_STALE
            else:
                status = HEALTH_STALE
            error_msg = "Last scrape failed but previous successes exist"
        else:
            status = HEALTH_BROKEN
            error_msg = "No successful scrapes recorded"

    await sources_repo.update_health(
        source_id,
        status,
        error_message=error_msg,
    )
    logger.info("Health: %s → %s (%s)", source_id, status, error_msg)
    return status
