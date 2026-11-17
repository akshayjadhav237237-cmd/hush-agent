"""Shell execution tool bounded by command safety and project directory."""
from __future__ import annotations

import subprocess
from typing import Any, Callable, Optional

DEFAULT_TIMEOUT = 120
MAX_OUTPUT_CHARS = 4000


class ShellTool:
    """Bounded shell execution tool tracking child subprocesses for lifecycle cleanup (I-003)."""

    def __init__(
        self,
        project_dir: str,
        run: Optional[Callable[..., Any]] = None,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> None:
        self.project_dir = project_dir
        self.timeout = timeout
        self._custom_run = run
        self.active_processes: list[subprocess.Popen[Any]] = []

    def _terminate_proc(self, proc: Any) -> None:
        """Safely terminate a subprocess and wait briefly before killing."""
        try:
            if hasattr(proc, "terminate"):
                proc.terminate()
            if hasattr(proc, "wait"):
                try:
                    proc.wait(timeout=2)
                except Exception:
                    if hasattr(proc, "kill"):
                        proc.kill()
        except Exception:
            pass

    def cleanup(self) -> None:
        """Terminate all actively tracked spawned subprocesses."""
        for proc in list(self.active_processes):
            self._terminate_proc(proc)
        self.active_processes.clear()

    def run_cmd(self, command: str) -> str:
        """Execute a shell command within project_dir after safety validation."""
        from core.command_safety import check_command

        blocked_reason = check_command(command, self.project_dir)
        if blocked_reason:
            return blocked_reason

        if self._custom_run is not None:
            try:
                r = self._custom_run(
                    command,
                    shell=True,
                    cwd=self.project_dir,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout,
                )
                out = ((r.stdout or "") + (r.stderr or ""))[-MAX_OUTPUT_CHARS:]
                return out or "(no output)"
            except subprocess.TimeoutExpired:
                return f"Command timed out after {self.timeout}s."
            except Exception as e:
                return f"Execution error: {e}"

        proc: Optional[subprocess.Popen[Any]] = None
        try:
            proc = subprocess.Popen(
                command,
                shell=True,
                cwd=self.project_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            self.active_processes.append(proc)
            stdout, stderr = proc.communicate(timeout=self.timeout)
            out = ((stdout or "") + (stderr or ""))[-MAX_OUTPUT_CHARS:]
            return out or "(no output)"
        except subprocess.TimeoutExpired:
            if proc is not None:
                self._terminate_proc(proc)
            return f"Command timed out after {self.timeout}s."
        except Exception as e:
            if proc is not None:
                self._terminate_proc(proc)
            return f"Execution error: {e}"
        finally:
            if proc is not None and proc in self.active_processes:
                self.active_processes.remove(proc)


def make_run_cmd(
    project_dir: str,
    run: Optional[Callable[..., Any]] = None,
) -> Callable[[str], str]:
    """Create a bounded run_cmd tool function for executing shell commands."""
    tool = ShellTool(project_dir, run=run)

    def run_cmd(command: str) -> str:
        return tool.run_cmd(command)

    setattr(run_cmd, "tool", tool)
    setattr(run_cmd, "cleanup", tool.cleanup)
    return run_cmd
