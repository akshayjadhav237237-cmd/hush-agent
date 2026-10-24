"""Command safety inspection and confinement validation."""
import os
import re
import shlex

ALLOWED_COMMANDS: set[str] = {
    "git",
    "npm",
    "node",
    "python",
    "pip",
    "dir",
    "type",
    "echo",
    "mkdir",
    "cd",
}

BLOCKED_SUBSTRINGS: tuple[str, ...] = (
    "rm -rf",
    "rmdir /s",
    "del /s",
    "format ",
    "shutdown",
    "reg delete",
    "diskpart",
    "powershell -enc",
    "curl ",
    "wget ",
    "invoke-webrequest",
    "&&",
    "||",
    "|",
    ">",
    "<",
    ";",
    "&",
    "%",
    "^",
    "`",
    "$(",
    "\n",
    "\r",
    "git push",
    "git remote",
    "git config",
    "git credential",
    "git -c",
    "pip install",
)

BLOCKED_PATH_NAMES: set[str] = {
    ".env",
    ".ssh",
    "id_rsa",
    "credentials",
    "secrets",
}


def _check_python_invocation(tokens: list[str]) -> str | None:
    """Validate python binary arguments."""
    if len(tokens) < 2:
        return "BLOCKED: python invocation requires a script or allowed module"

    if any(t.lower() == "-c" for t in tokens[1:]):
        return "BLOCKED: inline python evaluation is disallowed"

    first_arg = tokens[1]
    if first_arg == "-m":
        if len(tokens) < 3 or tokens[2].lower() not in ("pytest", "py_compile"):
            mod = tokens[2] if len(tokens) > 2 else ""
            return f"BLOCKED: python -m module '{mod}' is disallowed"
        return None

    if first_arg.startswith("-") or first_arg.startswith("/"):
        return f"BLOCKED: arbitrary python flag '{first_arg}' is disallowed"

    if not first_arg.lower().endswith(".py"):
        return f"BLOCKED: python script must be a .py file, got '{first_arg}'"

    if (
        os.path.isabs(first_arg)
        or bool(re.match(r"^[a-zA-Z]:", first_arg))
        or first_arg.startswith(("\\", "/"))
    ):
        return f"BLOCKED: python script must be a relative path, got '{first_arg}'"

    return None


def check_command(command: str, project_dir: str) -> str | None:
    """Check a command against allowlists and security confinement rules."""
    # 1. Empty or whitespace-only command
    if not command or not command.strip():
        return "BLOCKED: empty command"

    # 2. Blocked substrings (case-insensitive check)
    cmd_lower = command.lower()
    for pattern in BLOCKED_SUBSTRINGS:
        if pattern.lower() in cmd_lower:
            return f"BLOCKED: contains disallowed pattern '{pattern}'"

    # 3. Tokenize with shlex
    try:
        tokens = shlex.split(command, posix=False)
    except Exception:
        return "BLOCKED: invalid command syntax"

    if not tokens:
        return "BLOCKED: empty command"

    # 4. Binary check
    binary = tokens[0].lower()
    base_binary = binary.removesuffix(".exe")
    if binary not in ALLOWED_COMMANDS and base_binary not in ALLOWED_COMMANDS:
        return f"BLOCKED: binary '{binary}' is not in allowlist"

    # 5. Specific binary restrictions
    if base_binary == "npm":
        if any(t.lower() in ("-g", "--global") for t in tokens[1:]):
            return "BLOCKED: global npm installation is disallowed"

    if base_binary == "node":
        if any(t.lower() in ("-e", "--eval") for t in tokens[1:]):
            return "BLOCKED: inline node evaluation is disallowed"

    if base_binary == "python":
        py_err = _check_python_invocation(tokens)
        if py_err:
            return py_err

    # 6. Path confinement & Sensitive names
    project_real = os.path.realpath(project_dir)

    for token in tokens:
        # Sensitive file names check
        token_lower = token.lower()
        for name in sorted(BLOCKED_PATH_NAMES):
            if name.lower() in token_lower:
                return f"BLOCKED: access to sensitive file '{name}' is disallowed"

        # Determine path token (support --flag=val or /flag=val)
        if (token.startswith("-") or token.startswith("/")) and "=" in token:
            path_token = token.partition("=")[2].strip("'\"")
        else:
            path_token = token.strip("'\"")

        # Skip Windows-style switch flags like /w, /b, /s, /?, etc.
        if token.startswith("/") and re.match(r"^/[a-zA-Z\?]$", token):
            continue

        looks_like_path = (
            any(c in path_token for c in ("\\", "/", ":"))
            or path_token.startswith(("~", "%", "$"))
            or path_token == ".."
        )
        if not looks_like_path:
            continue

        # Parent directory traversal check
        segs = re.split(r"[\\/:]", path_token)
        if ".." in segs:
            return "BLOCKED: parent directory traversal ('..') is disallowed"

        # UNC path check
        if path_token.startswith(r"\\") or path_token.startswith("//"):
            return "BLOCKED: UNC network paths are disallowed"

        # Resolve path
        if re.match(r"^[a-zA-Z]:[\\/]", path_token):
            if os.name == "nt":
                resolved = os.path.realpath(path_token)
            else:
                return f"BLOCKED: path '{token}' escapes project directory"
        elif path_token.startswith(("~", "%", "$")):
            expanded = os.path.expanduser(os.path.expandvars(path_token))
            if expanded.startswith(("~", "$")):
                return f"BLOCKED: path '{token}' escapes project directory"
            resolved = os.path.realpath(os.path.join(project_dir, expanded))
        else:
            resolved = os.path.realpath(os.path.join(project_dir, path_token))
        try:
            common = os.path.commonpath([resolved, project_real])
            if (
                common != project_real
                and os.path.normcase(common) != os.path.normcase(project_real)
            ):
                return f"BLOCKED: path '{token}' escapes project directory"
        except ValueError:
            return f"BLOCKED: path '{token}' escapes project directory"

    return None
