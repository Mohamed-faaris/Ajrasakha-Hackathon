"""
CSV/JSON output adapter.

Saves scraped data to local files for offline demo/testing.
"""

from __future__ import annotations

import csv
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.constants import UNIFIED_PRICE_FIELDS

logger = logging.getLogger("mandi-agent")


class CsvOutput:
    """Save scrape results to CSV and JSON files."""

    def __init__(self, output_dir: str | Path) -> None:
        self._dir = Path(output_dir)
        self._dir.mkdir(parents=True, exist_ok=True)

    async def save_prices(self, records: list[dict[str, Any]]) -> int:
        """
        Save price records as both CSV and JSON.

        Returns the number of records written.
        """
        if not records:
            return 0

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

        # Write CSV
        csv_path = self._dir / f"prices_{timestamp}.csv"
        self._write_csv(csv_path, records)
        logger.info("Wrote %d records to %s", len(records), csv_path)

        # Write JSON
        json_path = self._dir / f"prices_{timestamp}.json"
        self._write_json(json_path, records)
        logger.info("Wrote %d records to %s", len(records), json_path)

        return len(records)

    async def save_source_config(self, config: dict[str, Any]) -> None:
        """Save a source config as JSON."""
        name = config.get("name") or config.get("entryUrl", "source")
        # Sanitize filename
        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name)
        path = self._dir / f"source_{safe_name}.json"
        self._write_json(path, config)
        logger.info("Wrote source config to %s", path)

    async def save_run(self, run_doc: dict[str, Any]) -> None:
        """Append a run log as JSON."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        path = self._dir / f"run_{timestamp}.json"
        self._write_json(path, run_doc)
        logger.info("Wrote run log to %s", path)

    # ── Private Helpers ──────────────────────────────────────────────────

    @staticmethod
    def _write_csv(path: Path, records: list[dict[str, Any]]) -> None:
        """Write records to a CSV file."""
        if not records:
            return

        # Use unified schema fields as column order, plus any extra fields
        fieldnames = list(UNIFIED_PRICE_FIELDS)
        extra = [k for k in records[0] if k not in fieldnames and not k.startswith("_")]
        fieldnames.extend(extra)

        with path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f, fieldnames=fieldnames, extrasaction="ignore"
            )
            writer.writeheader()
            writer.writerows(records)

    @staticmethod
    def _write_json(path: Path, data: Any) -> None:
        """Write data to a JSON file with serialization of common types."""

        def default_serializer(obj: Any) -> Any:
            if isinstance(obj, datetime):
                return obj.isoformat()
            if hasattr(obj, "__str__"):
                return str(obj)
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=default_serializer, ensure_ascii=False)
