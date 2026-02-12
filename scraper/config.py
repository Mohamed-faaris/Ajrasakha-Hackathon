"""
Runtime configuration.

Reads environment variables (loaded by app.env.loader) and CLI arguments,
producing an immutable AppConfig dataclass. CLI args override env vars.
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from enum import StrEnum


# ── Enums ────────────────────────────────────────────────────────────────────


class InputMode(StrEnum):
    MONGO = "mongo"
    CSV = "csv"


class LogMode(StrEnum):
    MONGO = "mongo"
    TXT = "txt"


class AgentMode(StrEnum):
    SCRAPE = "scrape"
    DISCOVER = "discover"
    DISCOVER_AND_SCRAPE = "discover_and_scrape"
    SINGLE_URL = "single_url"


class LLMProvider(StrEnum):
    GOOGLE = "google"
    OPENAI = "openai"


# ── Config Dataclass ─────────────────────────────────────────────────────────


@dataclass(frozen=True, slots=True)
class AppConfig:
    """Immutable runtime configuration."""

    # Database
    mongo_uri: str = ""
    db_name: str = "mandi_insights"

    # LLM
    llm_provider: LLMProvider = LLMProvider.GOOGLE
    google_api_key: str = ""
    openai_api_key: str = ""

    # Modes
    input_mode: InputMode = InputMode.MONGO
    log_mode: LogMode = LogMode.MONGO
    agent_mode: AgentMode = AgentMode.DISCOVER_AND_SCRAPE

    # Playwright
    headless: bool = True

    # Thresholds
    max_pages_per_source: int = 50
    discovery_timeout_seconds: int = 120
    request_delay_ms: int = 500

    # Runtime (set by CLI --url for single_url mode)
    target_url: str = ""

    # CSV paths (used when input_mode=csv)
    csv_input_path: str = "data/samples/sources.csv"
    csv_output_dir: str = "data/outputs"

    @classmethod
    def from_env(cls) -> AppConfig:
        """Build config from environment variables only."""
        return cls(
            mongo_uri=os.getenv("MONGO_URI", ""),
            db_name=os.getenv("DB_NAME", "mandi_insights"),
            llm_provider=LLMProvider(os.getenv("LLM_PROVIDER", "google").lower()),
            google_api_key=os.getenv("GOOGLE_API_KEY", ""),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            input_mode=InputMode(os.getenv("INPUT_MODE", "mongo").lower()),
            log_mode=LogMode(os.getenv("LOG_MODE", "mongo").lower()),
            agent_mode=AgentMode(os.getenv("AGENT_MODE", "discover_and_scrape").lower()),
            headless=os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes"),
            max_pages_per_source=int(os.getenv("MAX_PAGES_PER_SOURCE", "50")),
            discovery_timeout_seconds=int(os.getenv("DISCOVERY_TIMEOUT_SECONDS", "120")),
            request_delay_ms=int(os.getenv("REQUEST_DELAY_MS", "500")),
        )

    def with_cli_overrides(self, args: argparse.Namespace) -> AppConfig:
        """Return a new config with CLI argument overrides applied."""
        overrides: dict = {}

        if args.mode is not None:
            overrides["agent_mode"] = AgentMode(args.mode)
        if args.url is not None:
            overrides["target_url"] = args.url
            # Implicitly set single_url mode when --url is provided
            if args.mode is None:
                overrides["agent_mode"] = AgentMode.SINGLE_URL
        if args.input is not None:
            overrides["input_mode"] = InputMode(args.input)
        if args.log is not None:
            overrides["log_mode"] = LogMode(args.log)
        if args.headless is not None:
            overrides["headless"] = args.headless

        if not overrides:
            return self

        # Build a new frozen instance with overrides
        current = {f.name: getattr(self, f.name) for f in self.__dataclass_fields__.values()}
        current.update(overrides)
        return AppConfig(**current)


# ── CLI Parser ───────────────────────────────────────────────────────────────


def build_arg_parser() -> argparse.ArgumentParser:
    """Build the CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="mandi-ai-agent",
        description="AI-powered mandi price scraper agent",
    )
    parser.add_argument(
        "--mode",
        choices=[m.value for m in AgentMode],
        default=None,
        help="Agent execution mode (overrides AGENT_MODE env var)",
    )
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Target URL for single_url mode",
    )
    parser.add_argument(
        "--input",
        choices=[m.value for m in InputMode],
        default=None,
        help="Input source mode (overrides INPUT_MODE env var)",
    )
    parser.add_argument(
        "--log",
        choices=[m.value for m in LogMode],
        default=None,
        help="Logging mode (overrides LOG_MODE env var)",
    )
    parser.add_argument(
        "--headless",
        type=lambda v: v.lower() in ("true", "1", "yes"),
        default=None,
        help="Run browser headless (true/false)",
    )
    return parser
