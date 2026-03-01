"""
Logger factory.

Selects and configures the correct logger based on config.log_mode.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase

    from config import AppConfig, LogMode


def create_logger(
    config: AppConfig,
    db: AsyncIOMotorDatabase | None = None,
) -> logging.Logger:
    """
    Create a logger based on the configured log mode.

    Args:
        config: Application configuration.
        db: Motor database instance (required for mongo log mode).

    Returns:
        Configured logging.Logger instance.
    """
    from config import LogMode

    if config.log_mode == LogMode.MONGO:
        if db is None:
            # Fallback to txt if no DB available
            from app.logging.txt_logger import create_txt_logger

            logger = create_txt_logger()
            logger.warning(
                "LOG_MODE=mongo but no database connection available. "
                "Falling back to txt logger."
            )
            return logger

        from app.logging.mongo_logger import create_mongo_logger

        return create_mongo_logger(db)

    # Default: txt
    from app.logging.txt_logger import create_txt_logger

    return create_txt_logger()
