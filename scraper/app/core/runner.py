"""
Mode controller.

Dispatches execution based on config.agent_mode:
  - scrape: run scrape engine on all configured sources
  - discover: run discovery engine only
  - discover_and_scrape: discover then scrape
  - single_url: check DB → discover if needed → scrape
"""

from __future__ import annotations

import time
from typing import Any

from config import AgentMode, InputMode
from app.core.context import RunContext


async def run(ctx: RunContext) -> None:
    """
    Main dispatch: execute the configured agent mode.
    """
    mode = ctx.config.agent_mode
    ctx.logger.info("Runner dispatching mode: %s", mode)

    if mode == AgentMode.SCRAPE:
        await _run_scrape_mode(ctx)
    elif mode == AgentMode.DISCOVER:
        await _run_discover_mode(ctx)
    elif mode == AgentMode.DISCOVER_AND_SCRAPE:
        await _run_discover_and_scrape_mode(ctx)
    elif mode == AgentMode.SINGLE_URL:
        await _run_single_url_mode(ctx)
    else:
        ctx.logger.error("Unknown agent mode: %s", mode)


# ── Mode Implementations ────────────────────────────────────────────────────


async def _run_scrape_mode(ctx: RunContext) -> None:
    """
    Scrape mode: load all configured sources and scrape each one.

    Assumes sources already have extractionType and schemaMapping configured.
    """
    sources = await _load_sources(ctx)
    if not sources:
        ctx.logger.warning("No sources to scrape")
        return

    output = _get_output_adapter(ctx)

    for i, source in enumerate(sources, 1):
        source_url = source.get("entryUrl", "unknown")
        ctx.logger.info("─── Source %d/%d: %s ───", i, len(sources), source_url)

        ctx.source_url = source_url
        ctx.source_id = str(source.get("_id", ""))

        from app.scraping.scrape_engine import run_scrape

        records = await run_scrape(ctx, source)

        if records:
            saved = await output.save_prices(records)
            ctx.records_saved += saved

        # Save run log
        run_log = ctx.to_run_log()
        await output.save_run(run_log)

        # Update health
        await _update_health(ctx, source, success=bool(records), records_saved=len(records))


async def _run_discover_mode(ctx: RunContext) -> None:
    """
    Discover mode: crawl sources and find extraction strategies.

    Does not scrape — only saves discovered configs.
    """
    sources = await _load_sources(ctx)
    if not sources:
        ctx.logger.warning("No sources to discover")
        return

    output = _get_output_adapter(ctx)

    for i, source in enumerate(sources, 1):
        source_url = source.get("entryUrl", "unknown")
        ctx.logger.info("─── Discovery %d/%d: %s ───", i, len(sources), source_url)

        extraction_config = await _discover_source(ctx, source_url)
        if extraction_config:
            # Save extraction config to source
            from app.ai.discovery_mode import extraction_config_to_source_update
            update = extraction_config_to_source_update(extraction_config)
            source.update(update)
            await output.save_source_config(source)

            # Run mapping if we have an extraction config and sample data
            await _run_mapping_for_source(ctx, source, extraction_config, output)

        run_log = ctx.to_run_log()
        await output.save_run(run_log)


async def _run_discover_and_scrape_mode(ctx: RunContext) -> None:
    """
    Discover + Scrape mode: discover extraction strategy, then scrape.
    """
    sources = await _load_sources(ctx)
    if not sources:
        ctx.logger.warning("No sources to process")
        return

    output = _get_output_adapter(ctx)

    for i, source in enumerate(sources, 1):
        source_url = source.get("entryUrl", "unknown")
        ctx.logger.info("═══ Source %d/%d: %s ═══", i, len(sources), source_url)

        # Step 1: Discover if no extraction config
        if not source.get("extractionType"):
            ctx.logger.info("No extraction config — running discovery")
            extraction_config = await _discover_source(ctx, source_url)
            if extraction_config:
                from app.ai.discovery_mode import extraction_config_to_source_update
                update = extraction_config_to_source_update(extraction_config)
                source.update(update)
                await output.save_source_config(source)

                await _run_mapping_for_source(ctx, source, extraction_config, output)
            else:
                ctx.logger.warning("Discovery failed for %s — skipping scrape", source_url)
                continue

        # Step 2: Scrape
        from app.scraping.scrape_engine import run_scrape
        records = await run_scrape(ctx, source)

        if records:
            saved = await output.save_prices(records)
            ctx.records_saved += saved

        run_log = ctx.to_run_log()
        await output.save_run(run_log)
        await _update_health(ctx, source, success=bool(records), records_saved=len(records))


async def _run_single_url_mode(ctx: RunContext) -> None:
    """
    Single URL mode:
      1. Check DB for existing config
      2. If not found → run discovery
      3. If discovery succeeds → run scrape
    """
    target_url = ctx.config.target_url
    if not target_url:
        ctx.logger.error("--url is required for single_url mode")
        return

    ctx.logger.info("Single URL mode: %s", target_url)

    # Load source (checks DB, falls back to bare config)
    from app.inputs.single_url_input import SingleUrlInput
    single_input = SingleUrlInput(ctx.db, target_url)
    sources = await single_input.load_sources()
    source = sources[0]

    output = _get_output_adapter(ctx)

    ctx.source_url = target_url
    ctx.source_id = str(source.get("_id", ""))

    # Discover if needed
    if source.get("_needs_discovery", False):
        ctx.logger.info("No existing config — running discovery for %s", target_url)
        extraction_config = await _discover_source(ctx, target_url)

        if not extraction_config:
            ctx.logger.error("Discovery failed — cannot scrape %s", target_url)
            await _update_health(ctx, source, success=False)
            return

        from app.ai.discovery_mode import extraction_config_to_source_update
        update = extraction_config_to_source_update(extraction_config)
        source.update(update)

        # Save the newly discovered config
        source_id = await output.save_source_config(source)
        if source_id:
            ctx.source_id = source_id
            source["_id"] = source_id

        await _run_mapping_for_source(ctx, source, extraction_config, output)

    # Scrape
    from app.scraping.scrape_engine import run_scrape
    records = await run_scrape(ctx, source)

    if records:
        saved = await output.save_prices(records)
        ctx.records_saved += saved

    run_log = ctx.to_run_log()
    await output.save_run(run_log)
    await _update_health(ctx, source, success=bool(records), records_saved=len(records))


# ── Helpers ──────────────────────────────────────────────────────────────────


async def _load_sources(ctx: RunContext) -> list[dict[str, Any]]:
    """Load sources based on the configured input mode."""
    if ctx.config.input_mode == InputMode.CSV:
        from app.inputs.csv_input import CsvInput
        adapter = CsvInput(ctx.config.csv_input_path)
        return await adapter.load_sources()

    # Default: MongoDB
    if ctx.db is None:
        ctx.logger.error("INPUT_MODE=mongo but no database connection")
        return []

    from app.inputs.db_input import DbInput
    adapter = DbInput(ctx.db)
    return await adapter.load_sources()


def _get_output_adapter(ctx: RunContext) -> Any:
    """Get the appropriate output adapter."""
    if ctx.config.input_mode == InputMode.CSV:
        from app.outputs.csv_output import CsvOutput
        return CsvOutput(ctx.config.csv_output_dir)

    if ctx.db is not None:
        from app.outputs.db_output import DbOutput
        return DbOutput(ctx.db)

    # Fallback to CSV output
    from app.outputs.csv_output import CsvOutput
    return CsvOutput(ctx.config.csv_output_dir)


async def _discover_source(ctx: RunContext, entry_url: str) -> Any:
    """Run discovery + AI analysis for a source URL."""
    from app.discovery.discovery_engine import run_discovery
    from app.ai.discovery_mode import run_discovery_ai

    discovery_result = await run_discovery(ctx, entry_url)

    if not discovery_result.has_candidates:
        ctx.logger.warning("Discovery found no candidates for %s", entry_url)
        return None

    extraction_config = await run_discovery_ai(ctx, discovery_result)
    return extraction_config


async def _run_mapping_for_source(
    ctx: RunContext,
    source: dict[str, Any],
    extraction_config: Any,
    output: Any,
) -> None:
    """
    Run a quick scrape to get sample data, then generate schema mapping via AI.
    """
    if source.get("schemaMapping"):
        ctx.logger.debug("Source already has schemaMapping — skipping AI mapping")
        return

    from app.scraping.scrape_engine import run_scrape
    from app.ai.mapping_mode import run_mapping_ai, schema_mapping_to_source_update

    # Do a quick scrape to get sample data
    ctx.logger.info("Running quick scrape for schema mapping sample data...")
    sample_records = await run_scrape(ctx, source)

    if not sample_records:
        ctx.logger.warning("No sample data for mapping — skipping")
        return

    # Get raw field names from sample
    raw_fields = list(sample_records[0].keys())
    sample_data = sample_records[:5]

    mapping = await run_mapping_ai(
        ctx,
        raw_fields,
        sample_data,
        source.get("entryUrl", ""),
        source.get("extractionType", ""),
    )

    if mapping:
        update = schema_mapping_to_source_update(mapping)
        source.update(update)
        await output.save_source_config(source)
        ctx.logger.info("Schema mapping saved for %s", source.get("entryUrl"))


async def _update_health(
    ctx: RunContext,
    source: dict[str, Any],
    *,
    success: bool,
    records_saved: int = 0,
) -> None:
    """Update health status for a source."""
    source_id = str(source.get("_id", ""))
    if not source_id or not ctx.db:
        return

    from app.monitoring.health import update_health
    await update_health(ctx, source_id, success=success, records_saved=records_saved)
