"""
AI Mapping Mode.

Uses LangChain to analyze raw extracted data and generate a
schema mapping that maps source field names to the unified Price schema.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import BaseModel, Field

from app.ai.llm import get_llm
from app.ai.prompts import MAPPING_PROMPT
from app.core.context import RunContext

logger = logging.getLogger("mandi-agent")


# ── Structured Output Schema ────────────────────────────────────────────────


class FieldConversion(BaseModel):
    """A conversion rule for a mapped field."""

    multiply: float | None = Field(
        default=None, description="Multiplication factor (e.g., 100 for kg→quintal)"
    )
    date_format: str = Field(
        default="", description="Source date format string (e.g., '%d-%m-%Y')"
    )
    comment: str = Field(
        default="", description="Explanation of the conversion"
    )


class SchemaMapping(BaseModel):
    """AI-generated schema mapping configuration."""

    schema_mapping: dict[str, str] = Field(
        description=(
            "Map of raw field names to unified schema field names. "
            "Example: {'commodity': 'cropName', 'market': 'mandiName'}"
        )
    )
    conversions: dict[str, FieldConversion] = Field(
        default_factory=dict,
        description=(
            "Conversion rules keyed by unified field name. "
            "Example: {'modalPrice': {multiply: 100, comment: 'kg to quintal'}}"
        ),
    )
    confidence: float = Field(
        description="Confidence score between 0.0 and 1.0"
    )
    unmapped_fields: list[str] = Field(
        default_factory=list,
        description="Raw fields that could not be mapped to the schema",
    )
    notes: str = Field(
        default="", description="Any additional observations about the data"
    )


# ── Mapping Mode Function ───────────────────────────────────────────────────


async def run_mapping_ai(
    ctx: RunContext,
    raw_fields: list[str],
    sample_data: list[dict[str, Any]],
    source_url: str,
    extraction_type: str,
) -> SchemaMapping | None:
    """
    Use AI to generate a schema mapping from raw data fields.

    Args:
        ctx: Run context.
        raw_fields: List of field names from the raw data.
        sample_data: First 3-5 records of raw data.
        source_url: The source URL for context.
        extraction_type: The extraction type used ('api', 'html_table', etc.).

    Returns:
        SchemaMapping or None if mapping fails.
    """
    if not raw_fields:
        ctx.logger.warning("No raw fields provided — cannot generate mapping")
        return None

    ctx.logger.info("Running AI schema mapping for %d fields...", len(raw_fields))

    try:
        llm = get_llm(ctx.config)
        structured_llm = llm.with_structured_output(SchemaMapping)

        # Prepare sample data (truncate for token efficiency)
        sample_json = json.dumps(sample_data[:3], indent=2, default=str, ensure_ascii=False)

        result: SchemaMapping = await structured_llm.ainvoke(
            MAPPING_PROMPT.format_messages(
                raw_fields=json.dumps(raw_fields),
                sample_data=sample_json,
                source_url=source_url,
                extraction_type=extraction_type,
            )
        )

        ctx.logger.info(
            "AI mapping: %d fields mapped, %d unmapped (confidence: %.2f)",
            len(result.schema_mapping),
            len(result.unmapped_fields),
            result.confidence,
        )

        if result.conversions:
            for field_name, conv in result.conversions.items():
                ctx.logger.debug("  Conversion for %s: %s", field_name, conv.comment or conv)

        return result

    except Exception as exc:
        ctx.logger.error("AI mapping failed: %s", exc)
        ctx.add_error(source_url, f"AI mapping error: {exc}")
        return None


def schema_mapping_to_source_update(mapping: SchemaMapping) -> dict[str, Any]:
    """
    Convert a SchemaMapping to a dict for saving to the sources collection.
    """
    return {
        "schemaMapping": mapping.schema_mapping,
        "conversions": {
            k: v.model_dump(exclude_none=True) for k, v in mapping.conversions.items()
        },
        "mappingConfidence": mapping.confidence,
        "unmappedFields": mapping.unmapped_fields,
        "mappingNotes": mapping.notes,
    }
