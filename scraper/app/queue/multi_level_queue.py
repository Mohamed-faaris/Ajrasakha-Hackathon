"""
Multi-level priority queue.

A heapq-based URL queue with 4 priority levels (0-3).
Level 0 URLs are always dequeued first.
Tracks visited URLs to avoid re-processing.
"""

from __future__ import annotations

import heapq
from dataclasses import dataclass, field


@dataclass
class QueueItem:
    """An item in the priority queue."""

    level: int
    url: str
    depth: int = 0
    parent_url: str = ""

    def __lt__(self, other: QueueItem) -> bool:
        """Lower level = higher priority."""
        return self.level < other.level


class MultiLevelQueue:
    """
    Priority queue with 4 levels for URL exploration.

    Level 0: critical URLs (api, mandi, price, rate, report)
    Level 1: high probability pages (market watch, daily rates)
    Level 2: normal internal links
    Level 3: deep crawl (archive pages, downloads section)
    """

    def __init__(self, max_depth: int = 3) -> None:
        self._heap: list[QueueItem] = []
        self._seen: set[str] = set()
        self._max_depth = max_depth
        self._level_counts = {0: 0, 1: 0, 2: 0, 3: 0}

    def push(
        self,
        url: str,
        level: int,
        *,
        depth: int = 0,
        parent_url: str = "",
    ) -> bool:
        """
        Add a URL to the queue if not already seen and within depth limit.

        Returns True if the URL was added, False if skipped.
        """
        if url in self._seen:
            return False

        if depth > self._max_depth:
            return False

        level = max(0, min(3, level))  # Clamp to 0-3

        self._seen.add(url)
        item = QueueItem(level=level, url=url, depth=depth, parent_url=parent_url)
        heapq.heappush(self._heap, item)
        self._level_counts[level] += 1
        return True

    def pop(self) -> QueueItem | None:
        """
        Remove and return the highest-priority URL.

        Returns None if the queue is empty.
        """
        if not self._heap:
            return None
        return heapq.heappop(self._heap)

    def is_empty(self) -> bool:
        """Check if the queue has no more items."""
        return len(self._heap) == 0

    def mark_seen(self, url: str) -> None:
        """Mark a URL as seen without adding it to the queue."""
        self._seen.add(url)

    def is_seen(self, url: str) -> bool:
        """Check if a URL has already been seen."""
        return url in self._seen

    @property
    def size(self) -> int:
        """Number of items remaining in the queue."""
        return len(self._heap)

    @property
    def total_seen(self) -> int:
        """Total number of unique URLs that have been seen."""
        return len(self._seen)

    @property
    def level_counts(self) -> dict[int, int]:
        """Count of URLs added at each priority level."""
        return dict(self._level_counts)

    def stats(self) -> dict:
        """Return queue statistics for logging/debugging."""
        return {
            "remaining": self.size,
            "total_seen": self.total_seen,
            "level_counts": self.level_counts,
        }
