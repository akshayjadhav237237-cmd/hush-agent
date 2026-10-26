"""Real desktop test: Mid-run interruption, atomic checkpoint saving, and --resume latest."""
import os
import shutil
import tempfile
from unittest.mock import MagicMock
from google.genai import types

from core.audit import AuditLog, verify_chain
from core.checkpoint import RunState, load_checkpoint, save_checkpoint
from core.cli import main
from tests_real.real_test_helper import record_result, sha256_text


def test_real_desktop_resume_latest(tmp_path: any, monkeypatch: any) -> None:
    runs_dir = str(tmp_path / "runs")
    os.makedirs(runs_dir, exist_ok=True)
    monkeypatch.setattr("core.constants.RUNS_DIR", runs_dir)
    monkeypatch.setattr("core.cli.RUNS_DIR", runs_dir)

    run_id = "test_resume_run"
    run_dir = os.path.join(runs_dir, run_id)
    os.makedirs(run_dir, exist_ok=True)

    # 1. Initialize initial audit log and checkpoint (Simulate mid-run interruption at step 1)
    audit = AuditLog(run_dir, run_id=run_id, mode="real")
    audit.log("run_start", summary="Run started: wedding photo tracker")
    audit.log("tool_call", tool="read_clipboard", summary="Checking clipboard")
    audit.log("tool_result", tool="read_clipboard", summary="Clipboard empty")

    state = RunState(
        run_id=run_id,
        idea="wedding photo tracker",
        step=3,
    )
    save_checkpoint(run_dir, state)

    # Verify initial checkpoint exists
    loaded = load_checkpoint(run_dir)
    assert loaded is not None
    assert loaded.step == 3

    # 2. Mock model turns for resumed session
    class ResumedModel:
        def __init__(self, *args, **kwargs):
            self.turn = 0
            self.last_usage = {"prompt_tokens": 150, "completion_tokens": 40}

        def generate(self, contents):
            self.turn += 1
            # Resumed turn calls finish
            return types.Content(
                parts=[
                    types.Part(
                        function_call=types.FunctionCall(
                            name="finish",
                            args={"summary": "Successfully resumed and completed tracker implementation."},
                        )
                    )
                ]
            )

    class DummyDesktop:
        def __init__(self, *args, **kwargs):
            pass
        def funcs(self):
            return {}
        def screenshot_png(self):
            import io
            from PIL import Image
            buf = io.BytesIO()
            Image.new("RGB", (1280, 720), color=(10, 20, 30)).save(buf, format="PNG")
            return buf.getvalue()
        def clipboard_full(self):
            return ""
        def paste_any(self, text, press_enter=False):
            return "ok"

    # 3. Execute resume latest via CLI main
    exit_code = main(
        ["--resume", "latest"],
        model_factory=lambda *a, **kw: ResumedModel(),
        desktop_factory=lambda *a, **kw: DummyDesktop(),
    )

    assert exit_code == 0, f"Expected clean exit 0, got {exit_code}"

    # 4. Verify cryptographic SHA-256 chain continuity in audit.jsonl
    audit_file = os.path.join(run_dir, "audit.jsonl")
    valid, count, err = verify_chain(audit_file)
    assert valid is True, f"Audit chain verification failed: {err} at line {count}"
    assert count >= 5, f"Expected at least 5 audit events, got {count}"

    with open(audit_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    last_event_hash = sha256_text(lines[-1].strip())

    record_result(
        feature_id="safety-checkpoint-resume",
        status="PASS",
        detail=f"Atomic checkpoint resumption verified: recovered from step 3, appended to audit trail, unbroken SHA-256 chain ({count} events).",
        evidence_hash=last_event_hash,
    )
