"""Artifact management and run resumption for Hush agent."""
import hashlib
import os
import re
from typing import Any, Optional

ARTIFACT_NAME_PATTERN: re.Pattern[str] = re.compile(
    r"^(research_prompt|research_report|build_prompt_[1-9])$"
)
MAX_ARTIFACT_CHARS: int = 200_000


def is_valid_artifact_name(name: str) -> bool:
    """Return True if name matches allowed artifact pattern strictly."""
    if not isinstance(name, str):
        return False
    return bool(ARTIFACT_NAME_PATTERN.match(name))


def save_artifact(run_dir: str, name: str, text: str) -> str:
    """Save artifact text to disk, enforcing validation and character limit."""
    if not is_valid_artifact_name(name):
        return (
            f"ERROR: Invalid artifact name '{name}'. "
            "Allowed: research_prompt, research_report, build_prompt_1..9."
        )

    text = text[:MAX_ARTIFACT_CHARS]
    artifacts_dir = os.path.join(run_dir, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    path = os.path.join(artifacts_dir, f"{name}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]
    return f"Saved {name} ({len(text)} chars, sha {sha})"


def load_artifact(run_dir: str, name: str) -> Optional[str]:
    """Load and return artifact content if it exists, otherwise None."""
    if not is_valid_artifact_name(name):
        return None

    path = os.path.join(run_dir, "artifacts", f"{name}.txt")
    if not os.path.isfile(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None


def list_artifacts(run_dir: str) -> list[str]:
    """Return sorted list of valid artifact names found without .txt extension."""
    artifacts_dir = os.path.join(run_dir, "artifacts")
    if not os.path.isdir(artifacts_dir):
        return []

    try:
        entries = os.listdir(artifacts_dir)
    except OSError:
        return []

    found: list[str] = []
    for entry in entries:
        if entry.endswith(".txt"):
            stem = entry[:-4]
            if is_valid_artifact_name(stem):
                path = os.path.join(artifacts_dir, entry)
                if os.path.isfile(path):
                    found.append(stem)

    found.sort()
    return found


def build_resume_message(idea: str, artifacts: list[str], state: Any) -> str:
    """Generate prompt text resuming an interrupted run."""
    build_nums = [
        int(m.group(1))
        for name in artifacts
        if (m := re.match(r"^build_prompt_([1-9])$", name))
    ]

    if build_nums:
        highest_build = max(build_nums)
        if highest_build < 9:
            next_stage = f"build prompt {highest_build + 1} for Antigravity"
        else:
            next_stage = "final verification and completion"
    elif "research_report" in artifacts:
        next_stage = "build prompt 1 for Antigravity"
    elif "research_prompt" in artifacts:
        next_stage = "research report"
    else:
        next_stage = "research prompt"

    round_num = None
    if state is not None:
        if hasattr(state, "step") and isinstance(state.step, int):
            round_num = state.step
        elif hasattr(state, "round") and isinstance(state.round, int):
            round_num = state.round
        elif isinstance(state, dict) and isinstance(state.get("step"), int):
            round_num = state["step"]
        elif isinstance(state, dict) and isinstance(state.get("round"), int):
            round_num = state["round"]
        elif isinstance(state, int):
            round_num = state

    if round_num is None:
        round_num = max(build_nums) if build_nums else 1

    existing_str = ", ".join(sorted(artifacts)) if artifacts else "none"

    phase_str = ""
    if state is not None and getattr(state, "phase", None):
        phase_str = f"- Current phase: {getattr(state, 'phase')}\n"

    return (
        f"Resuming interrupted run:\n"
        f"- Original idea: {idea}\n"
        f"- Existing artifacts: {existing_str}\n"
        f"- Current build round: {round_num}\n"
        f"{phase_str}"
        f"- Next expected stage: {next_stage}\n\n"
        f"Directives:\n"
        f"- Finished stages MUST NOT be redone.\n"
        f"- Take a screenshot first to inspect current screen state.\n"
        f"- Use paste_artifact instead of re-typing long text."
    )
