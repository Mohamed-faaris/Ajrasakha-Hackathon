"""
LLM factory.

Instantiates the correct LangChain chat model based on config.llm_provider.
Supports Google Gemini, OpenAI GPT, and OpenRouter (OpenAI-compatible).
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from langchain_core.language_models import BaseChatModel

if TYPE_CHECKING:
    from config import AppConfig

logger = logging.getLogger("mandi-agent")

# Cache the model instance
_llm: BaseChatModel | None = None


def get_llm(config: AppConfig) -> BaseChatModel:
    """
    Get or create the LLM instance based on config.

    Returns a LangChain BaseChatModel that can be used with
    invoke(), with_structured_output(), etc.
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

        _llm = ChatOpenAI(
            model=config.openrouter_model,
            api_key=config.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.1,
            max_tokens=4096,
        )
        logger.info("LLM initialized: OpenRouter %s", config.openrouter_model)

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
