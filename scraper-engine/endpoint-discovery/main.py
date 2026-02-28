"""
Mandi AI Agent — Entrypoint.

Loads environment, builds config, initializes DB and logger,
then dispatches to the appropriate runner mode.
"""

from __future__ import annotations

import asyncio
import sys

from app.env.loader import load_environment

# Load .env files BEFORE anything reads os.getenv
load_environment()

from config import AppConfig, build_arg_parser  # noqa: E402


async def main(config: AppConfig) -> None:
    """Async main: connect DB, create logger, dispatch runner."""
    from app.core.context import RunContext
    from app.db import mongo
    from app.logging.logger_factory import create_logger

    # Connect to MongoDB (if needed)
    db = None
    if config.mongo_uri:
        try:
            db = await mongo.connect(config)
        except Exception as exc:
            print(f"[WARN] MongoDB connection failed: {exc}", file=sys.stderr)

    # Create logger
    logger = create_logger(config, db)
    logger.info("Mandi AI Agent starting")
    logger.info("Mode: %s | Input: %s | Log: %s", config.agent_mode, config.input_mode, config.log_mode)

    # Build run context
    ctx = RunContext(
        config=config,
        logger=logger,
        db=db,
    )

    try:
        # Import runner here to avoid circular imports at module level
        from app.core.runner import run

        await run(ctx)
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception:
        logger.exception("Unhandled error in agent")
        sys.exit(1)
    finally:
        logger.info(
            "Agent finished in %.1fs | Records: %d | Errors: %d",
            ctx.elapsed_seconds,
            ctx.records_saved,
            len(ctx.errors),
        )
        await mongo.close()


def cli() -> None:
    """Parse CLI args, build config, run async main."""
    parser = build_arg_parser()
    args = parser.parse_args()

    config = AppConfig.from_env().with_cli_overrides(args)
    asyncio.run(main(config))


if __name__ == "__main__":
    cli()
