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
    val = getattr(obj, attr, None)
    return val if val is not None else (obj.get(attr, default) if isinstance(obj, dict) else default)


def _extract_usage(resp: Any) -> Optional[dict[str, int]]:
    usage = _get(resp, "usage")
    if not usage:
        return None
    res = {k: v for k in ("prompt_tokens", "completion_tokens") if isinstance(v := _get(usage, k), int) and not isinstance(v, bool)}
    return res or None


extract_usage = _extract_usage


def _normalize_schema(val: Any) -> Any:
    if isinstance(val, dict):
        return {k: (v.lower() if k == "type" and isinstance(v, str) else _normalize_schema(v)) for k, v in val.items()}
    return [_normalize_schema(i) for i in val] if isinstance(val, list) else val


def convert_tools_to_openai(tools: Any) -> list[dict[str, Any]]:
    """Convert Google GenAI Tool declarations into OpenAI function tool definitions."""
    if not tools:
        return []
    decls: list[Any] = []
    if hasattr(tools, "function_declarations"):
        decls = list(tools.function_declarations or [])
    elif isinstance(tools, list):
        for item in tools:
            decls.extend(item.function_declarations if hasattr(item, "function_declarations") else [item])
    elif hasattr(tools, "name"):
        decls = [tools]

    out: list[dict[str, Any]] = []
    for d in decls:
        if isinstance(d, dict) and d.get("type") == "function":
            out.append(d)
            continue
        p = getattr(d, "parameters", None)
        raw = p.to_json_dict() if hasattr(p, "to_json_dict") else p.model_dump(exclude_none=True) if hasattr(p, "model_dump") else p if isinstance(p, dict) else {"type": "object", "properties": {}}
        out.append({"type": "function", "function": {"name": getattr(d, "name", ""), "description": getattr(d, "description", "") or "", "parameters": _normalize_schema(raw)}})
    return out


def validate_openai_messages(messages: list[dict[str, Any]]) -> None:
    """Validate that every assistant tool_calls message is followed immediately by exactly its tool messages."""
    i = 0
    while i < len(messages):
        msg = messages[i]
        role, tcs = msg.get("role"), msg.get("tool_calls")
        if role == "assistant" and tcs:
            for j, tc in enumerate(tcs):
                idx = i + 1 + j
                if idx >= len(messages):
                    raise ValueError(f"Message index {i}: assistant with tool_calls missing tool response for id {tc.get('id')!r}")
                tm = messages[idx]
                if tm.get("role") != "tool":
                    raise ValueError(f"Message index {idx}: expected role 'tool' after assistant tool_calls, got {tm.get('role')!r}")
                if tm.get("tool_call_id") != tc.get("id"):
                    raise ValueError(f"Message index {idx}: expected tool_call_id {tc.get('id')!r}, got {tm.get('tool_call_id')!r}")
                if not isinstance(tm.get("content"), str):
                    raise ValueError(f"Message index {idx}: tool message content must be string")
            i += 1 + len(tcs)
            continue
        if role == "tool":
            raise ValueError(f"Message index {i}: unexpected tool message without preceding assistant tool_calls")
        i += 1


def _format_fr(fr: Any) -> str:
    resp = _get(fr, "response")
    raw = resp if resp is not None else _get(fr, "content", "No result")
    return json.dumps(raw) if isinstance(raw, (dict, list)) else str(raw if raw is not None else "No result")


def _pack_user_media(texts: list[str], images: list[tuple[bytes, str]]) -> dict[str, Any]:
    if images:
        items: list[dict[str, Any]] = [{"type": "text", "text": t} for t in texts]
        for b, m in images:
            items.append({"type": "image_url", "image_url": {"url": f"data:{m};base64,{base64.b64encode(b).decode('ascii')}"}})
        return {"role": "user", "content": items}
    return {"role": "user", "content": "\n".join(texts)}


def convert_contents_to_openai_messages(contents: list[Any]) -> list[dict[str, Any]]:
    """Convert Google GenAI Content history into strictly ordered OpenAI ChatCompletion messages."""
    messages: list[dict[str, Any]] = []
    call_counter, k = 0, 0

    while k < len(contents):
        content = contents[k]
        role, parts = _get(content, "role", "user"), _get(content, "parts", []) or []

        if role in ("model", "assistant"):
            texts, tcs = [], []
            for p in parts:
                if t := _get(p, "text"):
                    texts.append(str(t))
                if (fc := _get(p, "function_call")) is not None:
                    cid = _get(fc, "id") or f"call_{call_counter}"
                    call_counter += 1
                    fa = _get(fc, "args", {})
                    tcs.append({"id": cid, "type": "function", "function": {"name": _get(fc, "name", ""), "arguments": json.dumps(fa) if isinstance(fa, dict) else str(fa or "{}")}})

            asst_msg: dict[str, Any] = {"role": "assistant", "content": "\n".join(texts) if texts else None}
            if tcs:
                asst_msg["tool_calls"] = tcs
            messages.append(asst_msg)

            if tcs:
                user_c = contents[k + 1] if (k + 1 < len(contents) and _get(contents[k + 1], "role", "user") not in ("model", "assistant")) else None
                if user_c:
                    k += 1
                frs, u_texts, u_imgs = [], [], []
                for p in (_get(user_c, "parts", []) or []):
                    if (fr := _get(p, "function_response")) is not None:
                        frs.append(fr)
                    elif t := _get(p, "text"):
                        u_texts.append(str(t))
                    elif (inl := _get(p, "inline_data")) is not None and (b := _get(inl, "data")):
                        u_imgs.append((b, _get(inl, "mime_type", "image/png")))

                paired: dict[int, str] = {}
                used_fr: set[int] = set()
                # 1. Match by id if present
                for j, fr in enumerate(frs):
                    if (fid := _get(fr, "id")):
                        for i, tc in enumerate(tcs):
                            if i not in paired and tc["id"] == fid:
                                paired[i], _ = _format_fr(fr), used_fr.add(j)
                                break
                # 2. Match by position
                for i, tc in enumerate(tcs):
                    if i not in paired and i < len(frs) and i not in used_fr:
                        if not (fn := _get(frs[i], "name", "")) or fn == tc["function"]["name"]:
                            paired[i], _ = _format_fr(frs[i]), used_fr.add(i)
                # 3. Match by name
                for i, tc in enumerate(tcs):
                    if i not in paired:
                        for j, fr in enumerate(frs):
                            if j not in used_fr and _get(fr, "name", "") == tc["function"]["name"]:
                                paired[i], _ = _format_fr(fr), used_fr.add(j)
                                break

                for i, tc in enumerate(tcs):
                    messages.append({"role": "tool", "tool_call_id": tc["id"], "content": paired.get(i, "No result")})

                if u_imgs or u_texts:
                    messages.append(_pack_user_media(u_texts, u_imgs))
            k += 1
        else:
            texts, images = [], []
            for p in parts:
                if _get(p, "function_response") is not None:
                    continue
                if t := _get(p, "text"):
                    texts.append(str(t))
                elif (inl := _get(p, "inline_data")) is not None and (b := _get(inl, "data")):
                    images.append((b, _get(inl, "mime_type", "image/png")))
            if images or texts:
                messages.append(_pack_user_media(texts, images))
            k += 1

    validate_openai_messages(messages)
    return messages


def convert_openai_response_to_genai_content(resp: Any) -> Any:
    """Convert an OpenAI ChatCompletion response into a Google GenAI Content object."""
    from google.genai import types

    choices = _get(resp, "choices", [])
    if not choices or (msg := _get(choices[0], "message")) is None:
        return None

    parts: list[Any] = []
    if txt := _get(msg, "content"):
        parts.append(types.Part.from_text(text=txt))

    for i, tc in enumerate(_get(msg, "tool_calls") or []):
        if (func := _get(tc, "function")) is None:
            continue
        raw_args = _get(func, "arguments", "")
        args = json.loads(raw_args) if isinstance(raw_args, str) and raw_args.strip() else raw_args if isinstance(raw_args, dict) else {}
        cid = f"call_{i}"
        parts.append(types.Part(function_call=types.FunctionCall(name=_get(func, "name", ""), args=args, id=cid)))

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
        self.model_name = model_name
        self.tools = tools
        self.sleep = sleep
        self.rand = rand
        self.audit = audit
        self.last_usage: Optional[dict[str, int]] = None

        if client is None:
            if not os.getenv("OPENAI_API_KEY"):
                raise ValueError("OPENAI_API_KEY environment variable is not set. Please set it to use OpenAIModelClient.")
            import openai
            self.client = openai.OpenAI(timeout=DEFAULT_TIMEOUT)
        else:
            self.client = client

        self.openai_tools = convert_tools_to_openai(tools)

    def generate(self, contents: list[Any]) -> Any:
        messages = convert_contents_to_openai_messages(contents)

        def _call() -> tuple[Any, Any]:
            kwargs: dict[str, Any] = {"model": self.model_name, "messages": messages, "timeout": DEFAULT_TIMEOUT}
            if self.openai_tools:
                kwargs["tools"] = self.openai_tools

            resp = self.client.chat.completions.create(**kwargs)
            content = convert_openai_response_to_genai_content(resp)
            if content is None:
                raise RuntimeError("empty response: model returned no content or tool calls")
            return content, resp

        def _on_retry(attempt: int, exc: Exception, delay: float) -> None:
            if self.audit:
                self.audit.log("retry", attempt=attempt, error=str(exc)[:200], delay=round(delay, 2))

        try:
            content, resp = with_backoff(_call, retries=REQUEST_RETRIES, base=BACKOFF_BASE, cap=BACKOFF_CAP, sleep=self.sleep, rand=self.rand, on_retry=_on_retry)
            self.last_usage = _extract_usage(resp)
            return content
        except Exception as e:
            raise ModelUnavailable(f"OpenAI generation failed after backoff retries: {e}") from e
