"""
Runtime context object.

Holds references to config, logger, database, and per-run state
(visited URLs, errors, record counts, timing).
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase

    from config import AppConfig


@dataclass
class RunContext:
    """Mutable per-run context passed through the pipeline."""

    config: AppConfig
    logger: logging.Logger
    db: AsyncIOMotorDatabase | None = None

    # Per-run state
    source_id: str = ""
    source_url: str = ""
    start_time: float = field(default_factory=time.time)
    visited_urls: list[str] = field(default_factory=list)
    errors: list[dict] = field(default_factory=list)
    records_extracted: int = 0
    records_saved: int = 0

    @property
    def elapsed_seconds(self) -> float:
        """Seconds elapsed since the run started."""
        return time.time() - self.start_time

    def add_error(self, url: str, error: str, *, fatal: bool = False) -> None:
        """Record an error encountered during the run."""
        self.errors.append({
            "url": url,
            "error": error,
            "fatal": fatal,
            "timestamp": time.time(),
        })
        if fatal:
            self.logger.error("FATAL [%s]: %s", url, error)
        else:
            self.logger.warning("[%s]: %s", url, error)

    def mark_visited(self, url: str) -> None:
        """Record a URL as visited."""
        self.visited_urls.append(url)

    def to_run_log(self) -> dict:
        """Serialize context state into a run log document for storage."""
        return {
            "sourceId": self.source_id,
            "sourceUrl": self.source_url,
            "startTime": self.start_time,
            "durationSeconds": self.elapsed_seconds,
            "visitedUrls": self.visited_urls,
            "visitedCount": len(self.visited_urls),
            "recordsExtracted": self.records_extracted,
            "recordsSaved": self.records_saved,
            "errors": self.errors,
            "errorCount": len(self.errors),
            "success": len([e for e in self.errors if e.get("fatal")]) == 0,
        }
