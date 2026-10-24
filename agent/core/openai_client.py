"""OpenAI model client for Hush agent with backoff retries, tool translation, and audit logging."""
from __future__ import annotations

import base64
import json
import os
import random
import time
from typing import Any, Callable, Optional

from core.model_client import ModelUnavailable
from core.retry import with_backoff

DEFAULT_TIMEOUT: float = 90.0
REQUEST_RETRIES: int = 5
BACKOFF_BASE: float = 2.0
BACKOFF_CAP: float = 60.0


def _get(obj: Any, attr: str, default: Any = None) -> Any:
    """Retrieve attribute from object or dict key."""
    val = getattr(obj, attr, None)
    if val is None and isinstance(obj, dict):
        return obj.get(attr, default)
    return val if val is not None else default


def _normalize_schema(val: Any) -> Any:
    """Normalize schema dictionary types to lowercase strings."""
    if isinstance(val, dict):
        return {
            k: (v.lower() if k == "type" and isinstance(v, str)
                else str(v.value).lower() if k == "type" and hasattr(v, "value")
                else _normalize_schema(v))
            for k, v in val.items()
        }
    if isinstance(val, list):
        return [_normalize_schema(item) for item in val]
    return val


def convert_tools_to_openai(tools: Any) -> list[dict[str, Any]]:
    """Convert Google GenAI Tool declarations into OpenAI function tool definitions."""
    if not tools:
        return []
    declarations: list[Any] = []
    if hasattr(tools, "function_declarations"):
        declarations = list(tools.function_declarations or [])
    elif isinstance(tools, list):
        for item in tools:
            if hasattr(item, "function_declarations"):
                declarations.extend(item.function_declarations or [])
            elif hasattr(item, "name"):
                declarations.append(item)
            elif isinstance(item, dict) and "type" in item:
                declarations.append(item)
    elif hasattr(tools, "name"):
        declarations = [tools]

    openai_tools: list[dict[str, Any]] = []
    for decl in declarations:
        if isinstance(decl, dict) and decl.get("type") == "function":
            openai_tools.append(decl)
            continue
        params = getattr(decl, "parameters", None)
        if hasattr(params, "to_json_dict"):
            raw_params = params.to_json_dict()
        elif hasattr(params, "model_dump"):
            raw_params = params.model_dump(exclude_none=True)
        elif isinstance(params, dict):
            raw_params = params
        else:
            raw_params = {"type": "object", "properties": {}}

        openai_tools.append({
            "type": "function",
            "function": {
                "name": getattr(decl, "name", ""),
                "description": getattr(decl, "description", "") or "",
                "parameters": _normalize_schema(raw_params),
            },
        })
    return openai_tools


def convert_contents_to_openai_messages(contents: list[Any]) -> list[dict[str, Any]]:
    """Convert Google GenAI Content history into OpenAI ChatCompletion messages."""
    messages: list[dict[str, Any]] = []
    pending_tool_calls: list[tuple[str, str]] = []
    call_counter = 0

    for content in contents:
        role = _get(content, "role", "user")
        parts = _get(content, "parts", []) or []

        if role in ("model", "assistant"):
            texts: list[str] = []
            tool_calls: list[dict[str, Any]] = []
            for p in parts:
                text_val = _get(p, "text")
                if text_val:
                    texts.append(str(text_val))
                fc = _get(p, "function_call")
                if fc is not None:
                    cid = _get(fc, "id") or f"call_{call_counter}"
                    call_counter += 1
                    fname = _get(fc, "name", "")
                    fargs = _get(fc, "args", {})
                    args_str = json.dumps(fargs) if isinstance(fargs, dict) else str(fargs or "{}")
                    tool_calls.append({
                        "id": cid,
                        "type": "function",
                        "function": {"name": fname, "arguments": args_str},
                    })
                    pending_tool_calls.append((cid, fname))

            msg: dict[str, Any] = {"role": "assistant", "content": "\n".join(texts) if texts else None}
            if tool_calls:
                msg["tool_calls"] = tool_calls
            messages.append(msg)
        else:
            func_responses: list[Any] = []
            texts = []
            images: list[tuple[bytes, str]] = []

            for p in parts:
                fr = _get(p, "function_response")
                if fr is not None:
                    func_responses.append(fr)
                    continue
                text_val = _get(p, "text")
                if text_val:
                    texts.append(str(text_val))
                    continue
                inline = _get(p, "inline_data")
                if inline is not None:
                    img_data = _get(inline, "data")
                    mime = _get(inline, "mime_type", "image/png")
                    if img_data:
                        images.append((img_data, mime))

            for fr in func_responses:
                fid = _get(fr, "id")
                if fid:
                    tool_call_id = fid
                    pending_tool_calls = [item for item in pending_tool_calls if item[0] != fid]
                elif pending_tool_calls:
                    fname = _get(fr, "name", "")
                    match_idx = next((i for i, item in enumerate(pending_tool_calls) if item[1] == fname), 0)
                    tool_call_id, _ = pending_tool_calls.pop(match_idx)
                else:
                    tool_call_id = f"call_{call_counter}"
                    call_counter += 1

                resp_obj = _get(fr, "response", {})
                content_str = json.dumps(resp_obj) if isinstance(resp_obj, (dict, list)) else str(resp_obj)
                messages.append({"role": "tool", "tool_call_id": tool_call_id, "content": content_str})

            if images:
                for idx, (pid, pname) in enumerate(list(pending_tool_calls)):
                    if pname == "screenshot":
                        pending_tool_calls.pop(idx)
                        messages.append({
                            "role": "tool",
                            "tool_call_id": pid,
                            "content": json.dumps({"result": "screenshot captured"}),
                        })
                        break
                content_items: list[dict[str, Any]] = [{"type": "text", "text": t} for t in texts]
                for img_bytes, mime in images:
                    b64_str = base64.b64encode(img_bytes).decode("ascii")
                    content_items.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64_str}"}})
                messages.append({"role": "user", "content": content_items})
            elif texts:
                messages.append({"role": "user", "content": "\n".join(texts)})

    return messages


def convert_openai_response_to_genai_content(resp: Any) -> Any:
    """Convert an OpenAI ChatCompletion response into a Google GenAI Content object."""
    from google.genai import types

    choices = _get(resp, "choices", [])
    if not choices:
        return None
    msg = _get(choices[0], "message")
    if msg is None:
        return None

    parts: list[Any] = []
    content_text = _get(msg, "content")
    if content_text:
        parts.append(types.Part.from_text(text=content_text))

    for i, tc in enumerate(_get(msg, "tool_calls") or []):
        func = _get(tc, "function")
        if func is None:
            continue
        raw_args = _get(func, "arguments", "")
        if isinstance(raw_args, str):
            try:
                args = json.loads(raw_args) if raw_args.strip() else {}
            except Exception:
                args = {"raw": raw_args}
        elif isinstance(raw_args, dict):
            args = raw_args
        else:
            args = {}
        call_id = f"call_{i}"
        fc = types.FunctionCall(name=_get(func, "name", ""), args=args, id=call_id)
        parts.append(types.Part(function_call=fc))

    return types.Content(role="model", parts=parts) if parts else None


class OpenAIModelClient:
    """Client for querying OpenAI chat completion models with backoff retry and tool calling."""

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
        """Initialize OpenAIModelClient with model name, tools, client, and retry settings."""
        self.model_name = model_name
        self.tools = tools
        self.sleep = sleep
        self.rand = rand
        self.audit = audit

        if client is None:
            if not os.getenv("OPENAI_API_KEY"):
                raise ValueError(
                    "OPENAI_API_KEY environment variable is not set. Please set it to use OpenAIModelClient."
                )
            import openai

            self.client = openai.OpenAI(timeout=DEFAULT_TIMEOUT)
        else:
            self.client = client

        self.openai_tools = convert_tools_to_openai(tools)

    def generate(self, contents: list[Any]) -> Any:
        """Generate content from OpenAI model with backoff retries and audit logging."""
        messages = convert_contents_to_openai_messages(contents)

        def _call() -> Any:
            kwargs: dict[str, Any] = {
                "model": self.model_name,
                "messages": messages,
                "timeout": DEFAULT_TIMEOUT,
            }
            if self.openai_tools:
                kwargs["tools"] = self.openai_tools

            resp = self.client.chat.completions.create(**kwargs)
            content = convert_openai_response_to_genai_content(resp)
            if content is None:
                raise RuntimeError("empty response: model returned no content or tool calls")
            return content

        def _on_retry(attempt: int, exc: Exception, delay: float) -> None:
            if self.audit:
                self.audit.log("retry", attempt=attempt, error=str(exc)[:200], delay=round(delay, 2))

        try:
            return with_backoff(
                _call,
                retries=REQUEST_RETRIES,
                base=BACKOFF_BASE,
                cap=BACKOFF_CAP,
                sleep=self.sleep,
                rand=self.rand,
                on_retry=_on_retry,
            )
        except Exception as e:
            raise ModelUnavailable(f"OpenAI generation failed after backoff retries: {e}") from e
