"""Constants and configuration paths for the Hush agent."""
import os

AGENT_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNS_DIR: str = os.path.join(AGENT_DIR, "runs")
WORKSPACE_DIR: str = os.path.join(AGENT_DIR, "workspace")

EXIT_OK: int = 0
EXIT_ERROR: int = 1
EXIT_FAILSAFE: int = 2
EXIT_KILL: int = 3
EXIT_MAX_STEPS: int = 4
EXIT_MODEL_FAILURE: int = 5

DEFAULT_MODEL: str = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")
MAX_STEPS_DEFAULT: int = 80
KEEP_SCREENSHOTS: int = 2
SHOT_WIDTH: int = 1280


def resolve_project_dir(mode: str, run_dir: str) -> str:
    """Resolve and ensure the target project directory exists."""
    env_dir = os.getenv("PROJECT_DIR")
    if env_dir:
        target = os.path.abspath(env_dir)
    elif mode == "demo":
        target = os.path.abspath(os.path.join(run_dir, "project"))
    else:
        target = os.path.abspath(os.path.join(WORKSPACE_DIR, "project"))

    os.makedirs(target, exist_ok=True)
    return target
