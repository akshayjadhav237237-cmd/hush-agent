"""Model client for interacting with Gemini API with backoff retry and audit logging."""
from __future__ import annotations

import os
import random
import time
from typing import Any, Callable, Optional


class ModelUnavailable(Exception):
    """Raised when model generation fails after exhausting backoff retries."""


def extract_usage(resp: Any) -> Optional[dict[str, int]]:
    """Safely extract token usage metadata from GenAI response."""
    try:
        if resp is None:
            return None

        usage_meta = resp.get("usage_metadata") if isinstance(resp, dict) else getattr(resp, "usage_metadata", None)
        if usage_meta is None:
            return None

        prompt_val = None
        try:
            if isinstance(usage_meta, dict):
                prompt_val = usage_meta.get("prompt_token_count")
                if prompt_val is None:
                    prompt_val = usage_meta.get("prompt_tokens")
            else:
                prompt_val = getattr(usage_meta, "prompt_token_count", None)
                if prompt_val is None:
                    prompt_val = getattr(usage_meta, "prompt_tokens", None)
        except Exception:
            pass

        completion_val = None
        try:
            if isinstance(usage_meta, dict):
                completion_val = usage_meta.get("candidates_token_count")
                if completion_val is None:
                    completion_val = usage_meta.get("completion_tokens")
            else:
                completion_val = getattr(usage_meta, "candidates_token_count", None)
                if completion_val is None:
                    completion_val = getattr(usage_meta, "completion_tokens", None)
        except Exception:
            pass

        usage: dict[str, int] = {}
        if isinstance(prompt_val, int) and not isinstance(prompt_val, bool):
            usage["prompt_tokens"] = prompt_val
        elif isinstance(prompt_val, str) and prompt_val.isdigit():
            usage["prompt_tokens"] = int(prompt_val)

        if isinstance(completion_val, int) and not isinstance(completion_val, bool):
            usage["completion_tokens"] = completion_val
        elif isinstance(completion_val, str) and completion_val.isdigit():
            usage["completion_tokens"] = int(completion_val)

        return usage if usage else None
    except Exception:
        return None


class ModelClient:
    """Client for managing Gemini model requests with exponential backoff and error handling."""

    def __init__(
        self,
        model_name: str,
        tools: Any,
        *,
        client: Optional[Any] = None,
        fallback_model: Optional[str] = None,
        sleep: Callable[[float], None] = time.sleep,
        rand: Callable[[], float] = random.random,
        audit: Optional[Any] = None,
    ) -> None:
        """Initialize ModelClient with model name, tools, client, and retry settings."""
        self.model_name = model_name
        self.fallback_model = fallback_model
        self.tools = tools
        self.sleep = sleep
        self.rand = rand
        self.audit = audit
        self.last_usage: Optional[dict[str, int]] = None
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

        def _call_for_model(m_name: str) -> tuple[Any, Any]:
            def _call() -> tuple[Any, Any]:
                resp = self.client.models.generate_content(
                    model=m_name,
                    contents=contents,
                    config=config,
                )
                content = extract_content(resp)
                if content is None:
                    raise RuntimeError("empty response: model returned no candidates or content was blocked")
                return content, resp

            def _on_retry(attempt: int, exc: Exception, delay: float) -> None:
                if self.audit:
                    self.audit.log("retry", model=m_name, attempt=attempt, error=str(exc)[:200], delay=round(delay, 2))

            return with_backoff(
                _call,
                retries=5,
                base=2.0,
                cap=60.0,
                sleep=self.sleep,
                rand=self.rand,
                on_retry=_on_retry,
            )

        try:
            content, resp = _call_for_model(self.model_name)
            self.last_usage = extract_usage(resp)
            return content
        except Exception as e:
            if self.fallback_model and self.fallback_model != self.model_name:
                if self.audit:
                    self.audit.log("model_fallback", from_model=self.model_name, to_model=self.fallback_model, error=str(e)[:200])
                try:
                    content, resp = _call_for_model(self.fallback_model)
                    self.last_usage = extract_usage(resp)
                    return content
                except Exception as fb_err:
                    raise ModelUnavailable(f"Both primary ({self.model_name}) and fallback ({self.fallback_model}) models failed: {fb_err}") from fb_err
            raise ModelUnavailable(f"Model generation failed after backoff retries: {e}") from e
