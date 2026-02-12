"""
AI Discovery Mode.

Uses LangChain to analyze discovery results and select the best
extraction strategy (API, HTML table, or PDF/Excel).
"""

from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import BaseModel, Field

from app.ai.llm import get_llm
from app.ai.prompts import DISCOVERY_PROMPT
from app.core.constants import MIN_DISCOVERY_CONFIDENCE
from app.core.context import RunContext
from app.discovery.discovery_engine import DiscoveryResult

logger = logging.getLogger("mandi-agent")


# ── Structured Output Schema ────────────────────────────────────────────────


class ExtractionConfig(BaseModel):
    """AI-generated extraction configuration."""

    extraction_type: str = Field(
        description="Type of extraction: 'api', 'html_table', or 'pdf_excel'"
    )
    confidence: float = Field(
        description="Confidence score between 0.0 and 1.0"
    )
    reasoning: str = Field(
        description="Brief explanation of why this method was chosen"
    )

    # API fields
    endpoint: str = Field(default="", description="API endpoint URL")
    method: str = Field(default="GET", description="HTTP method")
    params: dict[str, Any] = Field(
        default_factory=dict, description="Query parameters or POST body"
    )
    headers: dict[str, str] = Field(
        default_factory=dict, description="Required request headers"
    )

    # HTML table fields
    page_url: str = Field(default="", description="URL of the page containing the table")
    html_selector: str = Field(
        default="", description="CSS selector for the target table"
    )
    table_headers: list[str] = Field(
        default_factory=list, description="Expected column headers"
    )

    # File fields
    file_url: str = Field(default="", description="URL of the downloadable file")
    file_type: str = Field(default="", description="File type: 'pdf' or 'excel'")


# ── Discovery Mode Function ─────────────────────────────────────────────────


async def run_discovery_ai(
    ctx: RunContext,
    discovery_result: DiscoveryResult,
) -> ExtractionConfig | None:
    """
    Use AI to analyze discovery results and recommend extraction strategy.

    Returns an ExtractionConfig or None if discovery produced no candidates.
    """
    if not discovery_result.has_candidates:
        ctx.logger.warning("No candidates found during discovery — AI has nothing to analyze")
        return None

    # Build context for the LLM
    ai_context = discovery_result.to_ai_context()
    context_json = json.dumps(ai_context, indent=2, default=str)

    ctx.logger.info("Running AI discovery analysis...")

    try:
        llm = get_llm(ctx.config)
        structured_llm = llm.with_structured_output(ExtractionConfig)

        result: ExtractionConfig = await structured_llm.ainvoke(
            DISCOVERY_PROMPT.format_messages(discovery_context=context_json)
        )

        ctx.logger.info(
            "AI recommendation: %s (confidence: %.2f) — %s",
            result.extraction_type,
            result.confidence,
            result.reasoning,
        )

        # Reject low-confidence results
        if result.confidence < MIN_DISCOVERY_CONFIDENCE:
            ctx.logger.warning(
                "AI confidence %.2f below threshold %.2f — rejecting",
                result.confidence,
                MIN_DISCOVERY_CONFIDENCE,
            )
            return None

        return result

    except Exception as exc:
        ctx.logger.error("AI discovery analysis failed: %s", exc)
        ctx.add_error(
            discovery_result.source_url,
            f"AI discovery error: {exc}",
        )
        return None


def extraction_config_to_source_update(config: ExtractionConfig) -> dict[str, Any]:
    """
    Convert an ExtractionConfig to a dict for saving to the sources collection.
    """
    update: dict[str, Any] = {
        "extractionType": config.extraction_type,
        "aiConfidence": config.confidence,
        "aiReasoning": config.reasoning,
    }

    if config.extraction_type == "api":
        update["endpoint"] = config.endpoint
        update["endpointMethod"] = config.method
        update["endpointParams"] = config.params
        update["endpointHeaders"] = config.headers
    elif config.extraction_type == "html_table":
        update["htmlPageUrl"] = config.page_url
        update["htmlSelector"] = config.html_selector
        update["htmlTableHeaders"] = config.table_headers
    elif config.extraction_type == "pdf_excel":
        update["fileUrl"] = config.file_url
        update["fileType"] = config.file_type

    return update
