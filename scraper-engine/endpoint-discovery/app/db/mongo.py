"""
Async MongoDB connection manager using Motor.

Provides a singleton-style async client and database accessor
for the shared mandi_insights database.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

if TYPE_CHECKING:
    from config import AppConfig

# Module-level singleton
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect(config: AppConfig) -> AsyncIOMotorDatabase:
    """
    Initialize the Motor client and return the database.

    Subsequent calls return the same database instance.
    """
    global _client, _db

    if _db is not None:
        return _db

    if not config.mongo_uri:
        raise ValueError("MONGO_URI is not set. Cannot connect to MongoDB.")

    _client = AsyncIOMotorClient(config.mongo_uri)
    _db = _client[config.db_name]

    # Verify connectivity with a ping
    await _client.admin.command("ping")

    return _db


def get_db() -> AsyncIOMotorDatabase:
    """
    Return the current database instance.

    Raises RuntimeError if connect() has not been called yet.
    """
    if _db is None:
        raise RuntimeError(
            "Database not initialized. Call 'await connect(config)' first."
        )
    return _db


async def close() -> None:
    """Close the Motor client connection."""
    global _client, _db

    if _client is not None:
        _client.close()
        _client = None
        _db = None
