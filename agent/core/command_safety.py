"""Command safety inspection and confinement validation.

LIMITATIONS & THREAT MODEL (README_LIMITATIONS):
The command safety filter is an operational guardrail designed to prevent accidental
or overt escapes, destructive commands, shell injection, and sensitive file access.
IT IS NOT AN OPERATING SYSTEM SANDBOX.
By design, allowed interpreters such as `python` (executing relative `.py` scripts or
`python -m pytest`) and `npm` (running scripts or tests) execute code with the privileges
of the running user. Any process execution model that permits executing scripts or build
tools inherently allows code execution within the project boundaries.
True OS-level isolation requires OS sandbox primitives (such as Windows AppContainer,
Windows Sandbox, or containerized execution).
"""
import os
import re
import shlex
import unicodedata

README_LIMITATIONS: str = """Command Allowlist Confinement Limitations:
1. Operational Filter vs. OS Sandbox: The command validation provided here is an
   application-level operational filter, NOT a hardware or operating system sandbox.
2. Code Execution by Design:
   - Python: Allowed invocations (`python script.py`, `python -m pytest`) execute user
     code located within the project directory. User scripts can invoke Win32 APIs,
     perform network calls, or access permitted resources with user privileges.
   - Node / NPM: Allowed invocations (`node script.js`, `npm test`, `npm run build`)
     execute JavaScript code within project boundaries by design.
3. Confinement Scope:
   This module guarantees that commands, binaries, subcommands, and path arguments
   conform to strict allowlists, prevent path traversal, block command chaining,
   and prohibit access to sensitive files and dangerous flags (e.g., git -c, node -e).
   System-level containment beyond project boundaries requires an OS-level sandbox.
"""

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

SAFE_GIT_SUBCOMMANDS: set[str] = {
    "status",
    "diff",
    "log",
    "show",
    "branch",
    "checkout",
    "add",
    "commit",
    "stash",
    "rev-parse",
    "init",
}

DISALLOWED_GIT_SUBCOMMANDS: set[str] = {
    "push",
    "config",
    "remote",
    "credential",
}

WINDOWS_RESERVED_DEVICE_NAMES: re.Pattern[str] = re.compile(
    r"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$",
    re.IGNORECASE,
)

HOMOGLYPH_MAP: dict[str, str] = {
    "\u0430": "a",
    "\u0441": "c",
    "\u0435": "e",
    "\u043e": "o",
    "\u0440": "p",
    "\u0445": "x",
    "\u0443": "y",
    "\u0456": "i",
    "\u0458": "j",
    "\u0410": "A",
    "\u0421": "C",
    "\u0415": "E",
    "\u041e": "O",
    "\u0420": "P",
    "\u0425": "X",
    "\u0406": "I",
    "\u0408": "J",
}


def strip_quotes(s: str) -> str:
    """Strip all single and double quotes from string."""
    return s.replace('"', "").replace("'", "")


def normalize_text(text: str) -> str:
    """Normalize Unicode characters using NFKC and mapped homoglyphs."""
    nfkc = unicodedata.normalize("NFKC", text)
    return "".join(HOMOGLYPH_MAP.get(c, c) for c in nfkc)


def _check_python_invocation(tokens: list[str], clean_tokens: list[str]) -> str | None:
    """Validate python binary arguments."""
    if len(tokens) < 2:
        return "BLOCKED: python invocation requires a script or allowed module"

    if any(t.lower() == "-c" or t.lower().startswith("-c=") for t in clean_tokens[1:]):
        return "BLOCKED: inline python evaluation is disallowed"

    first_arg = clean_tokens[1]
    raw_first = tokens[1]
    if first_arg == "-m":
        if len(clean_tokens) < 3 or clean_tokens[2].lower() not in (
            "pytest",
            "py_compile",
        ):
            mod = clean_tokens[2] if len(clean_tokens) > 2 else ""
            return f"BLOCKED: python -m module '{mod}' is disallowed"
        return None

    if first_arg.startswith("-") or first_arg.startswith("/"):
        return f"BLOCKED: arbitrary python flag '{raw_first}' is disallowed"

    if not first_arg.lower().endswith(".py"):
        return f"BLOCKED: python script must be a .py file, got '{raw_first}'"

    if (
        os.path.isabs(first_arg)
        or bool(re.match(r"^[a-zA-Z]:", first_arg))
        or first_arg.startswith(("\\", "/"))
    ):
        return f"BLOCKED: python script must be a relative path, got '{raw_first}'"

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

    # 3. Normalize Unicode and tokenize with shlex
    norm_cmd = normalize_text(command)
    try:
        tokens = shlex.split(norm_cmd, posix=False)
    except Exception:
        return "BLOCKED: invalid command syntax"

    if not tokens:
        return "BLOCKED: empty command"

    # 4. Binary check
    binary = strip_quotes(tokens[0]).lower()
    base_binary = binary.removesuffix(".exe")
    if binary not in ALLOWED_COMMANDS and base_binary not in ALLOWED_COMMANDS:
        return f"BLOCKED: binary '{tokens[0]}' is not in allowlist"

    clean_tokens = [strip_quotes(t) for t in tokens]

    # 5. Specific binary restrictions
    if base_binary == "git":
        # Block -c and --config-env at token level in any spacing, tab, or quoting form
        for t in clean_tokens[1:]:
            tl = t.lower()
            if t == "-c" or t.startswith(("-c=", "-c")) or tl == "--config-env" or tl.startswith("--config-env"):
                return "BLOCKED: git -c or --config-env configuration override is disallowed"

        # Find subcommand
        subcmd = None
        skip_next = False
        for t in clean_tokens[1:]:
            if skip_next:
                skip_next = False
                continue
            if t.startswith("-") or t.startswith("/"):
                # Handle global options taking arguments
                if t in ("-C", "--git-dir", "--work-tree"):
                    skip_next = True
                continue
            subcmd = t.lower()
            break

        if not subcmd:
            return "BLOCKED: git command requires a valid subcommand"

        if subcmd in DISALLOWED_GIT_SUBCOMMANDS:
            return f"BLOCKED: git subcommand '{subcmd}' is disallowed"

        if subcmd not in SAFE_GIT_SUBCOMMANDS:
            return f"BLOCKED: git subcommand '{subcmd}' is disallowed"

    if base_binary == "pip":
        for t in clean_tokens[1:]:
            tl = t.lower()
            if tl in ("install", "uninstall"):
                return f"BLOCKED: pip '{tl}' is disallowed"

    if base_binary == "npm":
        for t in clean_tokens[1:]:
            tl = t.lower()
            if (
                tl in ("-g", "--global", "--location=global")
                or tl.startswith(("-g=", "--global=", "--location=global"))
            ):
                return "BLOCKED: global npm installation is disallowed"

    if base_binary == "node":
        for t in clean_tokens[1:]:
            tl = t.lower()
            if (
                tl in ("-e", "--eval", "-p", "--print", "-pe", "-ep")
                or tl.startswith(("-e=", "--eval=", "-p=", "--print="))
            ):
                return "BLOCKED: inline node evaluation is disallowed"

    if base_binary == "python":
        py_err = _check_python_invocation(tokens, clean_tokens)
        if py_err:
            return py_err

    # 6. Path confinement & Sensitive names
    project_real = os.path.realpath(project_dir)

    for i, token in enumerate(tokens):
        if i == 0:
            continue
        clean_token = clean_tokens[i]

        # 8.3 short filename check
        if re.search(r"(?:^|[\\/])[a-zA-Z0-9_]{1,6}~\d", clean_token):
            return f"BLOCKED: 8.3 short filename '{token}' is disallowed"

        # Windows DOS reserved device names
        parts = re.split(r"[\\/]", clean_token)
        for part in parts:
            if WINDOWS_RESERVED_DEVICE_NAMES.match(part):
                return f"BLOCKED: Windows reserved device name '{token}' is disallowed"

        # Sensitive file names check (stripping quotes and trailing dots/spaces)
        token_lower = clean_token.rstrip(". ").lower()
        for name in sorted(BLOCKED_PATH_NAMES):
            if name.lower() in token_lower:
                return f"BLOCKED: access to sensitive file '{name}' is disallowed"

        # Determine path token (support --flag=val or /flag=val)
        if (
            clean_token.startswith("-") or clean_token.startswith("/")
        ) and "=" in clean_token:
            path_token = clean_token.partition("=")[2]
        else:
            path_token = clean_token

        # Skip Windows-style switch flags like /w, /b, /s, /?, etc.
        if token.startswith("/") and re.match(r"^/[a-zA-Z\?]$", token):
            continue

        # Trailing dots and spaces check
        segs = re.split(r"[\\/]", path_token)
        for seg in segs:
            if seg not in (".", "..") and (seg.endswith(".") or seg.endswith(" ")):
                return f"BLOCKED: trailing dot or space in path '{token}' is disallowed"

        looks_like_path = (
            any(c in path_token for c in ("\\", "/", ":"))
            or path_token.startswith(("~", "%", "$"))
            or path_token == ".."
        )
        if not looks_like_path:
            continue

        # ADS check: Any colon not at index 1 (like C:) or multiple colons
        if ":" in path_token:
            if not (
                len(path_token) >= 2
                and path_token[1] == ":"
                and path_token[0].isalpha()
                and ":" not in path_token[2:]
            ):
                return f"BLOCKED: alternate data stream (ADS) path '{token}' is disallowed"

        # Parent directory traversal check
        if ".." in segs:
            return "BLOCKED: parent directory traversal ('..') is disallowed"

        # UNC path check
        if path_token.startswith(r"\\") or path_token.startswith("//"):
            return "BLOCKED: UNC network paths are disallowed"

        # Environment variable expansion check
        if re.search(r"\$[a-zA-Z0-9_]+|\$\{[a-zA-Z0-9_]+\}", path_token):
            return f"BLOCKED: environment variable expansion in '{token}' is disallowed"

        # Resolve path
        if re.match(r"^[a-zA-Z]:", path_token):
            if not re.match(r"^[a-zA-Z]:[\\/]", path_token):
                # Drive-relative path like C:windows\win.ini or C:
                return f"BLOCKED: path '{token}' escapes project directory"
            if os.name == "nt":
                resolved = os.path.realpath(path_token)
            else:
                return f"BLOCKED: path '{token}' escapes project directory"
        elif path_token.startswith(("~", "%", "$")):
            expanded = os.path.expanduser(os.path.expandvars(path_token))
            if expanded.startswith(("~", "$", "%")):
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
