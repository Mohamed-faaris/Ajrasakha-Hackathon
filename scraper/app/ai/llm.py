"""
LLM factory.

Instantiates the correct LangChain chat model based on config.llm_provider.
Supports Google Gemini, OpenAI GPT, and OpenRouter (OpenAI-compatible).

For OpenRouter free models that lack tool-calling / JSON mode,
get_structured_llm() provides a fallback that strips markdown fences
and parses raw JSON with Pydantic.
"""

from __future__ import annotations

import json
import logging
import re
from typing import TYPE_CHECKING, TypeVar

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from langchain_core.runnables import Runnable, RunnableLambda
from pydantic import BaseModel

if TYPE_CHECKING:
    from config import AppConfig

logger = logging.getLogger("mandi-agent")

T = TypeVar("T", bound=BaseModel)

# Cache the model instance
_llm: Runnable | None = None


def get_llm(config: AppConfig) -> Runnable:
    """
    Get or create the LLM instance based on config.

    Returns a LangChain Runnable (BaseChatModel or RunnableWithFallbacks)
    that can be used with invoke().
    """
    global _llm

    if _llm is not None:
        return _llm

    from config import LLMProvider

    if config.llm_provider == LLMProvider.OPENAI:
        if not config.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")

        from langchain_openai import ChatOpenAI

        _llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=config.openai_api_key,
            temperature=0.1,
            max_tokens=4096,
        )
        logger.info("LLM initialized: OpenAI gpt-4o-mini")

    elif config.llm_provider == LLMProvider.OPENROUTER:
        if not config.openrouter_api_key:
            raise ValueError(
                "OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter"
            )

        from langchain_openai import ChatOpenAI

        models = []
        for model_name in config.openrouter_model:
            models.append(
                ChatOpenAI(
                    model=model_name,
                    api_key=config.openrouter_api_key,
                    base_url="https://openrouter.ai/api/v1",
                    temperature=0.1,
                    max_tokens=4096,
                )
            )

        if not models:
            # Should be covered by config defaults, but just in case
            _llm = ChatOpenAI(
                model="google/gemini-2.0-flash-001",
                api_key=config.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1",
                temperature=0.1,
                max_tokens=4096,
            )
        elif len(models) == 1:
            _llm = models[0]
        else:
            # Use the first model as primary, others as fallbacks
            # This creates a RunnableWithFallbacks that automatically retries
            # with the next model if the previous one fails
            _llm = models[0].with_fallbacks(models[1:])

        logger.info("LLM initialized: OpenRouter models %s", config.openrouter_model)

    else:
        # Default: Google Gemini
        if not config.google_api_key:
            raise ValueError("GOOGLE_API_KEY is required when LLM_PROVIDER=google")

        from langchain_google_genai import ChatGoogleGenerativeAI

        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=config.google_api_key,
            temperature=0.1,
            max_output_tokens=4096,
        )
        logger.info("LLM initialized: Google Gemini 2.0 Flash")

    return _llm


def reset_llm() -> None:
    """Reset the cached LLM instance (useful for testing)."""
    global _llm
    _llm = None


# ── Structured Output Helpers ────────────────────────────────────────────────

# Regex to strip ```json ... ``` fences
_FENCE_RE = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)
# Regex to strip <think>...</think> blocks (some reasoning models emit these)
_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)


def _extract_json(text: str) -> str:
    """
    Extract raw JSON from an LLM response that may contain:
      - <think>...</think> reasoning blocks
      - ```json ... ``` markdown fences
      - Leading/trailing whitespace or prose
    """
    # Strip thinking blocks
    text = _THINK_RE.sub("", text).strip()

    # Try markdown fence first
    m = _FENCE_RE.search(text)
    if m:
        return m.group(1).strip()

    # Try to find raw JSON object/array
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = text.find(start_char)
        end = text.rfind(end_char)
        if start != -1 and end > start:
            return text[start : end + 1]

    # Last resort — return as-is and let Pydantic fail with a clear error
    return text


def get_structured_llm(config: AppConfig, schema: type[T]) -> Runnable:
    """
    Get a Runnable that returns a parsed Pydantic model.

    For Google / OpenAI: uses native with_structured_output().
    For OpenRouter: falls back to prompt-based JSON extraction + Pydantic parsing,
    since many free models don't support tool calling or JSON mode.
    """
    from config import LLMProvider

    llm = get_llm(config)

    if config.llm_provider != LLMProvider.OPENROUTER:
        # We know for these providers llm is a BaseChatModel
        if isinstance(llm, BaseChatModel):
            return llm.with_structured_output(schema)
        # Should not happen given get_llm logic, but safe fallback
        return llm.with_structured_output(schema)  # type: ignore

    # ── OpenRouter fallback ──────────────────────────────────────────────
    # Build the JSON schema instruction once
    json_schema = json.dumps(schema.model_json_schema(), indent=2)
    schema_instruction = (
        "\n\nYou MUST respond with ONLY a valid JSON object (no markdown fences, "
        "no explanation, no extra text). The JSON must conform to this schema:\n\n"
        f"{json_schema}\n\n"
        "Do NOT wrap the JSON in ```json``` or any other formatting. "
        "Output ONLY the raw JSON object."
    )

    async def _invoke(messages: list[BaseMessage]) -> T:
        # Clone messages to avoid modifying the input list
        augmented = list(messages)
        
        # Append the JSON schema instruction to the last message if possible
        # (This avoids using SystemMessage which some models like Gemma reject)
        if augmented and isinstance(augmented[-1].content, str):
            last_msg = augmented[-1]
            new_content = last_msg.content + schema_instruction
            # Replace the last message with a new instance of the same type
            augmented[-1] = type(last_msg)(content=new_content)
        else:
            # Fallback: append as a new HumanMessage
            augmented.append(HumanMessage(content=schema_instruction))
            
        response = await llm.ainvoke(augmented)
        raw = response.content if isinstance(response.content, str) else str(response.content)
        extracted = _extract_json(raw)
        return schema.model_validate_json(extracted)

    return RunnableLambda(_invoke)
