"""
MongoDB logger.

A custom logging.Handler that inserts log records into the
scrape_runs collection (or a dedicated logs collection).
Also logs to stdout so the console stays useful during development.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase

import asyncio


class MongoLogHandler(logging.Handler):
    """
    Logging handler that buffers records and flushes them to MongoDB.

    Since logging.Handler.emit() is synchronous but Motor is async,
    we schedule the insert onto the running event loop.
    """

    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        collection_name: str = "agent_logs",
        *,
        level: int = logging.DEBUG,
    ) -> None:
        super().__init__(level)
        self._collection = db[collection_name]

    def emit(self, record: logging.LogRecord) -> None:
        """Schedule an async insert for this log record."""
        doc = {
            "timestamp": datetime.now(timezone.utc),
            "level": record.levelname,
            "logger": record.name,
            "message": self.format(record),
            "module": record.module,
            "funcName": record.funcName,
            "lineNo": record.lineno,
        }
        if record.exc_info and record.exc_info[1]:
            doc["exception"] = str(record.exc_info[1])

        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._collection.insert_one(doc))
        except RuntimeError:
            # No running loop (e.g., during shutdown) -- silently drop
            pass


def create_mongo_logger(
    db: AsyncIOMotorDatabase,
    name: str = "mandi-agent",
) -> logging.Logger:
    """
    Create and return a logger that writes to MongoDB and stdout.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Mongo handler
    mongo_handler = MongoLogHandler(db)
    mongo_handler.setFormatter(formatter)
    logger.addHandler(mongo_handler)

    # Console handler (always present for visibility)
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    return logger
