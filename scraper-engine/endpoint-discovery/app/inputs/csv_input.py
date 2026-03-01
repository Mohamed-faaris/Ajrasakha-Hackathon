"""
CSV input adapter.

Loads source configurations from a CSV file for offline demo/testing.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any


class CsvInput:
    """Load sources from a CSV file."""

    def __init__(self, csv_path: str | Path) -> None:
        self._path = Path(csv_path)

    async def load_sources(self) -> list[dict[str, Any]]:
        """
        Read source configurations from a CSV file.

        Expected CSV columns:
          entryUrl, baseUrl, extractionType, name (optional)

        Returns a list of source config dicts.
        """
        if not self._path.exists():
            raise FileNotFoundError(
                f"CSV sources file not found: {self._path}"
            )

        sources: list[dict[str, Any]] = []

        with self._path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                entry_url = row.get("entryUrl", "").strip()
                if not entry_url:
                    continue

                source: dict[str, Any] = {
                    "entryUrl": entry_url,
                    "baseUrl": row.get("baseUrl", "").strip() or entry_url,
                    "name": row.get("name", "").strip(),
                }

                # Optional fields
                ext_type = row.get("extractionType", "").strip()
                if ext_type:
                    source["extractionType"] = ext_type

                endpoint = row.get("endpoint", "").strip()
                if endpoint:
                    source["endpoint"] = endpoint

                sources.append(source)

        return sources
