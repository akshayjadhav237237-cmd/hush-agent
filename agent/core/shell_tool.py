"""Shell execution tool bounded by command safety and project directory."""
import subprocess
from typing import Any, Callable

DEFAULT_TIMEOUT = 120
MAX_OUTPUT_CHARS = 4000


def make_run_cmd(
    project_dir: str,
    run: Callable[..., Any] = subprocess.run,
) -> Callable[[str], str]:
    """Create a bounded run_cmd tool function for executing shell commands."""

    def run_cmd(command: str) -> str:
        """Execute a shell command within project_dir after safety validation."""
        from core.command_safety import check_command

        blocked_reason = check_command(command, project_dir)
        if blocked_reason:
            return blocked_reason
        try:
            r = run(
                command,
                shell=True,
                cwd=project_dir,
                capture_output=True,
                text=True,
                timeout=DEFAULT_TIMEOUT,
            )
            out = ((r.stdout or "") + (r.stderr or ""))[-MAX_OUTPUT_CHARS:]
            return out or "(no output)"
        except subprocess.TimeoutExpired:
            return f"Command timed out after {DEFAULT_TIMEOUT}s."
        except Exception as e:
            return f"Execution error: {e}"

    return run_cmd
