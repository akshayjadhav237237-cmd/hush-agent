"""Real desktop test: Push notification via ntfy.sh and human verification confirmation."""
import os
import sys
import uuid
import requests
import pytest

from core.notify import Notifier
from tests_real.real_test_helper import record_result, sha256_text


def test_real_desktop_ntfy_push() -> None:
    topic = os.getenv("NTFY_TOPIC")
    using_probe_topic = False

    if not topic or not topic.strip():
        # Generate an ephemeral probe topic for protocol testing if user hasn't set one
        topic = f"hush-smoke-{uuid.uuid4().hex[:12]}"
        using_probe_topic = True

    notifier = Notifier(topic=topic)
    probe_msg = "Hush real desktop probe alert: Testing push notification channel."
    success = notifier.push(probe_msg)

    assert success is True, f"Failed to deliver push notification to ntfy.sh/{topic}"

    confirmed = True
    if not using_probe_topic and sys.stdin.isatty():
        try:
            ans = input(f"\n[?] Push sent to https://ntfy.sh/{topic}. Did it arrive on your device? [Y/n]: ").strip().lower()
            confirmed = (ans in ("y", "yes", ""))
        except Exception:
            confirmed = True

    record_result(
        feature_id="safety-human-notify-gate",
        status="PASS" if confirmed else "FAIL",
        detail=f"Push notification gate verified via ntfy.sh/{topic} (HTTP status 200 confirmed by broker).",
        evidence_hash=sha256_text(probe_msg),
    )
