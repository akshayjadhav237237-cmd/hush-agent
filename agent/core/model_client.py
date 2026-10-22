"""Model client for interacting with Gemini API with backoff retry and audit logging."""
from __future__ import annotations

import os
import random
import time
from typing import Any, Callable, Optional


class ModelUnavailable(Exception):
    """Raised when model generation fails after exhausting backoff retries."""


class ModelClient:
    """Client for managing Gemini model requests with exponential backoff and error handling."""

    def __init__(
        self,
        model_name: str,
        tools: Any,
        *,
        client: Optional[Any] = None,
        sleep: Callable[[float], None] = time.sleep,
        rand: Callable[[], float] = random.random,
        audit: Optional[Any] = None,
    ) -> None:
        """Initialize ModelClient with model name, tools, client, and retry settings."""
        self.model_name = model_name
        self.tools = tools
        self.sleep = sleep
        self.rand = rand
        self.audit = audit
        if client is None:
            if not os.getenv("GEMINI_API_KEY"):
                raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it to use ModelClient.")
            from google import genai

            self.client = genai.Client()
        else:
            self.client = client

    def make_config(self, tools: Any = None) -> Any:
        """Create GenerateContentConfig disabling automatic function calling."""
        if tools is None:
            tools = self.tools
        from google.genai import types

        tool_list = [tools] if (tools is not None and not isinstance(tools, list)) else tools
        return types.GenerateContentConfig(
            tools=tool_list,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )

    def generate(self, contents: list[Any]) -> Any:
        """Generate content from Gemini model with backoff retries and audit logging."""
        from core.retry import extract_content, with_backoff

        config = self.make_config(self.tools)

        def _call() -> Any:
            resp = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config,
            )
            content = extract_content(resp)
            if content is None:
                raise RuntimeError("empty response: model returned no candidates or content was blocked")
            return content

        def _on_retry(attempt: int, exc: Exception, delay: float) -> None:
            if self.audit:
                self.audit.log("retry", attempt=attempt, error=str(exc)[:200], delay=round(delay, 2))

        try:
            return with_backoff(
                _call,
                retries=5,
                base=2.0,
                cap=60.0,
                sleep=self.sleep,
                rand=self.rand,
                on_retry=_on_retry,
            )
        except Exception as e:
            raise ModelUnavailable(f"Model generation failed after backoff retries: {e}") from e
