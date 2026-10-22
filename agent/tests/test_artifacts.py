"""Unit tests for artifact management and run resumption."""
import hashlib
import os
from pathlib import Path
from typing import Any
import pytest

from core.artifacts import (
    ARTIFACT_NAME_PATTERN,
    MAX_ARTIFACT_CHARS,
    build_resume_message,
    is_valid_artifact_name,
    list_artifacts,
    load_artifact,
    save_artifact,
)


def test_valid_artifact_names_accepted() -> None:
    """Verify all valid artifact names match the pattern and are accepted."""
    valid_names = ["research_prompt", "research_report"] + [
        f"build_prompt_{i}" for i in range(1, 10)
    ]
    for name in valid_names:
        assert is_valid_artifact_name(name) is True
        assert ARTIFACT_NAME_PATTERN.match(name) is not None


def test_invalid_artifact_names_rejected() -> None:
    """Verify invalid names, path traversals, and arbitrary strings are rejected."""
    invalid_names = [
        "build_prompt_0",
        "build_prompt_10",
        "build_prompt_99",
        "../../etc",
        "evil",
        "secret.txt",
        "research_prompt.txt",
        "build_prompt_1.txt",
        "../research_prompt",
        "research_prompt/nested",
        "",
        "research_report_extra",
        "build_prompt_1_extra",
    ]
    for name in invalid_names:
        assert is_valid_artifact_name(name) is False
        assert ARTIFACT_NAME_PATTERN.match(name) is None


def test_save_artifact_writes_file_and_returns_summary(tmp_path: Path) -> None:
    """Verify save_artifact writes file and returns chars and 12-char SHA."""
    run_dir = str(tmp_path)
    text = "Specification document for web application."
    result = save_artifact(run_dir, "research_prompt", text)

    expected_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]
    assert len(expected_sha) == 12
    assert result == f"Saved research_prompt ({len(text)} chars, sha {expected_sha})"

    artifact_file = tmp_path / "artifacts" / "research_prompt.txt"
    assert artifact_file.is_file()
    assert artifact_file.read_text(encoding="utf-8") == text


def test_save_artifact_rejects_invalid_name(tmp_path: Path) -> None:
    """Verify save_artifact rejects invalid name without writing any file."""
    run_dir = str(tmp_path)
    result = save_artifact(run_dir, "invalid_artifact", "Some text")
    assert result.startswith("ERROR: Invalid artifact name 'invalid_artifact'.")

    artifacts_dir = tmp_path / "artifacts"
    assert not artifacts_dir.exists()


def test_save_artifact_enforces_max_char_cap(tmp_path: Path) -> None:
    """Verify save_artifact truncates text exceeding MAX_ARTIFACT_CHARS."""
    run_dir = str(tmp_path)
    large_text = "A" * (MAX_ARTIFACT_CHARS + 50_000)
    result = save_artifact(run_dir, "research_report", large_text)

    truncated_text = "A" * MAX_ARTIFACT_CHARS
    expected_sha = hashlib.sha256(truncated_text.encode("utf-8")).hexdigest()[:12]
    assert result == f"Saved research_report ({MAX_ARTIFACT_CHARS} chars, sha {expected_sha})"

    artifact_file = tmp_path / "artifacts" / "research_report.txt"
    assert artifact_file.is_file()
    content = artifact_file.read_text(encoding="utf-8")
    assert len(content) == MAX_ARTIFACT_CHARS
    assert content == truncated_text


def test_load_artifact_retrieves_exact_content_or_none(tmp_path: Path) -> None:
    """Verify load_artifact reads content and returns None for missing/invalid."""
    run_dir = str(tmp_path)

    # Missing before save
    assert load_artifact(run_dir, "build_prompt_1") is None

    # Save and retrieve
    text = "System prompt round 1\nLine 2 with utf-8: \u2713"
    save_artifact(run_dir, "build_prompt_1", text)
    loaded = load_artifact(run_dir, "build_prompt_1")
    assert loaded == text

    # Invalid names return None even if path traversal or arbitrary
    assert load_artifact(run_dir, "../../etc") is None
    assert load_artifact(run_dir, "build_prompt_0") is None
    assert load_artifact(run_dir, "secret.txt") is None


def test_list_artifacts_returns_sorted_valid_names(tmp_path: Path) -> None:
    """Verify list_artifacts returns sorted valid names without .txt extension."""
    run_dir = str(tmp_path)

    # Empty when artifacts dir does not exist
    assert list_artifacts(run_dir) == []

    # Save multiple valid artifacts
    save_artifact(run_dir, "build_prompt_3", "content 3")
    save_artifact(run_dir, "research_report", "content report")
    save_artifact(run_dir, "build_prompt_1", "content 1")
    save_artifact(run_dir, "research_prompt", "content prompt")

    # Manually drop invalid files and directories into artifacts dir
    artifacts_dir = tmp_path / "artifacts"
    (artifacts_dir / "build_prompt_0.txt").write_text("bad", encoding="utf-8")
    (artifacts_dir / "notes.txt").write_text("bad", encoding="utf-8")
    (artifacts_dir / "other.md").write_text("bad", encoding="utf-8")
    (artifacts_dir / "subdir.txt").mkdir()

    names = list_artifacts(run_dir)
    assert names == [
        "build_prompt_1",
        "build_prompt_3",
        "research_prompt",
        "research_report",
    ]


def test_build_resume_message_content_and_directives() -> None:
    """Verify build_resume_message produces formatted text with required instructions."""
    idea = "Build a portfolio website for a photographer"
    artifacts = ["research_prompt", "research_report"]

    msg = build_resume_message(idea, artifacts, state=None)

    # Original idea
    assert idea in msg
    # Existing artifacts listed
    assert "research_prompt, research_report" in msg
    # Next stage
    assert "build prompt 1 for Antigravity" in msg
    # Directives
    assert "Finished stages MUST NOT be redone." in msg
    assert "Take a screenshot first to inspect current screen state." in msg
    assert "Use paste_artifact instead of re-typing long text." in msg


def test_build_resume_message_stage_progression_and_state() -> None:
    """Verify next stage progression and state round extraction."""
    idea = "Test project"

    # Stage 0: No artifacts -> research prompt
    msg0 = build_resume_message(idea, [], state=None)
    assert "research prompt" in msg0
    assert "Existing artifacts: none" in msg0

    # Stage 1: research_prompt only -> research report
    msg1 = build_resume_message(idea, ["research_prompt"], state=None)
    assert "Next expected stage: research report" in msg1

    # Stage 2: research_report -> build prompt 1 for Antigravity
    msg2 = build_resume_message(idea, ["research_prompt", "research_report"], state=None)
    assert "Next expected stage: build prompt 1 for Antigravity" in msg2

    # Stage 3: build_prompt_1 -> build prompt 2 for Antigravity
    msg3 = build_resume_message(
        idea, ["research_prompt", "research_report", "build_prompt_1"], state=None
    )
    assert "Next expected stage: build prompt 2 for Antigravity" in msg3
    assert "Current build round: 1" in msg3

    # Stage with object state containing step
    class MockState:
        step: int = 5

    msg_step = build_resume_message(
        idea, ["build_prompt_1", "build_prompt_2"], state=MockState()
    )
    assert "Current build round: 5" in msg_step
    assert "Next expected stage: build prompt 3 for Antigravity" in msg_step

    # Stage with dict state
    msg_dict = build_resume_message(
        idea, ["build_prompt_1"], state={"step": 4}
    )
    assert "Current build round: 4" in msg_dict
