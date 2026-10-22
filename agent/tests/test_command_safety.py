"""Unit tests for command safety validation."""
from pathlib import Path
import pytest

from core.command_safety import check_command


@pytest.fixture
def project_dir(tmp_path: Path) -> str:
    """Fixture providing an isolated project directory."""
    return str(tmp_path)


def test_blocked_substring_classes(project_dir: str) -> None:
    """Disallowed commands and operators in BLOCKED_SUBSTRINGS must be blocked."""
    cases = [
        ("rm -rf node_modules", "rm -rf"),
        ("RM -RF dist", "rm -rf"),
        ("rmdir /s /q build", "rmdir /s"),
        ("del /s *.obj", "del /s"),
        ("format D:", "format "),
        ("shutdown /s /t 0", "shutdown"),
        ("reg delete HKLM\\Software", "reg delete"),
        ("diskpart", "diskpart"),
        ("powershell -enc AAAA", "powershell -enc"),
        ("POWERSHELL -ENC AAAA", "powershell -enc"),
        ("curl http://evil.com", "curl "),
        ("wget http://evil.com", "wget "),
        ("invoke-webrequest http://evil.com", "invoke-webrequest"),
        ("echo a && echo b", "&&"),
        ("echo a || echo b", "||"),
        ("echo a | cat", "|"),
        ("echo a > output.txt", ">"),
        ("echo a < input.txt", "<"),
        ("echo a ; echo b", ";"),
    ]
    for cmd, pattern in cases:
        result = check_command(cmd, project_dir)
        assert result == f"BLOCKED: contains disallowed pattern '{pattern}'"


def test_single_char_and_control_blocked(project_dir: str) -> None:
    """Single shell special characters and control characters must be blocked."""
    cases = [
        ("echo 1 & echo 2", "&"),
        ("echo %USERPROFILE%", "%"),
        ("echo ^", "^"),
        ("echo `dir`", "`"),
        ("echo $(whoami)", "$("),
        ("echo line1\nline2", "\n"),
        ("echo line1\rline2", "\r"),
    ]
    for cmd, pattern in cases:
        result = check_command(cmd, project_dir)
        assert result == f"BLOCKED: contains disallowed pattern '{pattern}'"


def test_dangerous_git_and_pip_flags(project_dir: str) -> None:
    """Dangerous git operations and pip install are disallowed."""
    cases = [
        ("git push origin main", "git push"),
        ("git remote add origin https://evil.com", "git remote"),
        ("git config user.email test@test.com", "git config"),
        ("git credential fill", "git credential"),
        ("git -c evil=true status", "git -c"),
        ("pip install requests", "pip install"),
    ]
    for cmd, pattern in cases:
        result = check_command(cmd, project_dir)
        assert result == f"BLOCKED: contains disallowed pattern '{pattern}'"


def test_dangerous_npm_node_python_flags(project_dir: str) -> None:
    """Dangerous flags for npm, node, and python must be blocked."""
    assert (
        check_command("npm install -g express", project_dir)
        == "BLOCKED: global npm installation is disallowed"
    )
    assert (
        check_command("npm --global install express", project_dir)
        == "BLOCKED: global npm installation is disallowed"
    )
    assert (
        check_command("node -e 'console.log(1)'", project_dir)
        == "BLOCKED: inline node evaluation is disallowed"
    )
    assert (
        check_command("node --eval 'console.log(1)'", project_dir)
        == "BLOCKED: inline node evaluation is disallowed"
    )
    assert (
        check_command('python -c "print(1)"', project_dir)
        == "BLOCKED: inline python evaluation is disallowed"
    )


def test_allowed_python_invocations(project_dir: str) -> None:
    """Permitted python invocations (-m pytest, -m py_compile, relative .py)."""
    assert (
        check_command("python -m pytest tests/test_command_safety.py -q", project_dir)
        is None
    )
    assert check_command("python -m pytest", project_dir) is None
    assert check_command("python.exe -m pytest", project_dir) is None
    assert check_command("python -m py_compile script.py", project_dir) is None
    assert check_command("python local_script.py", project_dir) is None
    assert check_command("python subfolder/nested_script.py", project_dir) is None
    assert check_command("python local_script.py --arg1 val1", project_dir) is None


def test_disallowed_python_invocations(project_dir: str) -> None:
    """Disallowed python invocations (arbitrary flags, non-.py, absolute paths)."""
    assert (
        check_command("python", project_dir)
        == "BLOCKED: python invocation requires a script or allowed module"
    )
    assert (
        check_command("python -m unittest", project_dir)
        == "BLOCKED: python -m module 'unittest' is disallowed"
    )
    assert (
        check_command("python -v script.py", project_dir)
        == "BLOCKED: arbitrary python flag '-v' is disallowed"
    )
    assert (
        check_command("python script.sh", project_dir)
        == "BLOCKED: python script must be a .py file, got 'script.sh'"
    )
    assert (
        check_command("python C:\\evil\\script.py", project_dir)
        == "BLOCKED: python script must be a relative path, got 'C:\\evil\\script.py'"
    )


def test_absolute_path_outside_project_dir(project_dir: str) -> None:
    """Absolute paths outside project directory must be blocked."""
    res1 = check_command(
        "type C:\\Windows\\System32\\drivers\\etc\\hosts", project_dir
    )
    assert res1 is not None
    assert "escapes project directory" in res1
    assert "C:\\Windows\\System32\\drivers\\etc\\hosts" in res1

    res2 = check_command("dir C:\\Windows", project_dir)
    assert res2 is not None
    assert "escapes project directory" in res2

    res3 = check_command("type /etc/passwd", project_dir)
    assert res3 is not None
    assert "escapes project directory" in res3


def test_parent_directory_traversal(project_dir: str) -> None:
    """Parent directory traversal ('..') must be blocked."""
    assert (
        check_command("type ..\\..\\something", project_dir)
        == "BLOCKED: parent directory traversal ('..') is disallowed"
    )
    assert (
        check_command("dir ../something", project_dir)
        == "BLOCKED: parent directory traversal ('..') is disallowed"
    )
    assert (
        check_command("cd ..", project_dir)
        == "BLOCKED: parent directory traversal ('..') is disallowed"
    )
    assert (
        check_command("node app.js --dir=../parent", project_dir)
        == "BLOCKED: parent directory traversal ('..') is disallowed"
    )


def test_unc_paths(project_dir: str) -> None:
    """UNC network paths must be blocked."""
    assert (
        check_command("dir \\\\host\\share\\evil", project_dir)
        == "BLOCKED: UNC network paths are disallowed"
    )
    assert (
        check_command("type //host/share/evil", project_dir)
        == "BLOCKED: UNC network paths are disallowed"
    )
    assert (
        check_command("node --file=\\\\server\\share\\evil.js", project_dir)
        == "BLOCKED: UNC network paths are disallowed"
    )


def test_flag_value_path_outside_project(project_dir: str) -> None:
    """Flag values pointing outside project directory must be blocked."""
    res1 = check_command("node --file=D:\\other\\file.txt", project_dir)
    assert res1 is not None
    assert "escapes project directory" in res1
    assert "--file=D:\\other\\file.txt" in res1

    res2 = check_command(
        "python local_script.py --output=C:\\evil\\out.txt", project_dir
    )
    assert res2 is not None
    assert "escapes project directory" in res2

    res3 = check_command(
        "python local_script.py /flag=D:\\other\\file.txt", project_dir
    )
    assert res3 is not None
    assert "escapes project directory" in res3


def test_sensitive_file_names_blocked(project_dir: str) -> None:
    """Access to sensitive file names (.env, .ssh, id_rsa, credentials, secrets) is blocked."""
    assert (
        check_command("type .env", project_dir)
        == "BLOCKED: access to sensitive file '.env' is disallowed"
    )
    assert (
        check_command("type subfolder\\.env", project_dir)
        == "BLOCKED: access to sensitive file '.env' is disallowed"
    )
    assert (
        check_command("node app.js --config=.env", project_dir)
        == "BLOCKED: access to sensitive file '.env' is disallowed"
    )
    res_ssh = check_command("type .ssh/id_rsa", project_dir)
    assert res_ssh is not None
    assert res_ssh.startswith("BLOCKED: access to sensitive file ")
    assert (
        check_command("type credentials.json", project_dir)
        == "BLOCKED: access to sensitive file 'credentials' is disallowed"
    )
    assert (
        check_command("type my_secrets.txt", project_dir)
        == "BLOCKED: access to sensitive file 'secrets' is disallowed"
    )


def test_allowed_relative_path_inside_project_dir(project_dir: str) -> None:
    """Valid relative paths inside project directory should be allowed."""
    assert check_command("type subfolder\\file.txt", project_dir) is None
    assert check_command("dir subfolder/nested", project_dir) is None
    assert check_command("node app/index.js", project_dir) is None
    assert check_command("python local_script.py", project_dir) is None
    assert check_command("mkdir new_dir", project_dir) is None
    assert check_command("cd subfolder", project_dir) is None
    assert check_command("echo hello world", project_dir) is None
    assert check_command("git status", project_dir) is None
    assert check_command("npm test", project_dir) is None


def test_empty_or_whitespace_command(project_dir: str) -> None:
    """Empty or whitespace-only commands must return blocked."""
    assert check_command("", project_dir) == "BLOCKED: empty command"
    assert check_command("   ", project_dir) == "BLOCKED: empty command"
    assert check_command("\t\t", project_dir) == "BLOCKED: empty command"


def test_disallowed_binary(project_dir: str) -> None:
    """Binaries not in ALLOWED_COMMANDS must be rejected."""
    assert (
        check_command("gcc main.c", project_dir)
        == "BLOCKED: binary 'gcc' is not in allowlist"
    )
    assert (
        check_command("powershell script.ps1", project_dir)
        == "BLOCKED: binary 'powershell' is not in allowlist"
    )
    assert (
        check_command("cmd /c dir", project_dir)
        == "BLOCKED: binary 'cmd' is not in allowlist"
    )
    assert (
        check_command("bash script.sh", project_dir)
        == "BLOCKED: binary 'bash' is not in allowlist"
    )


def test_invalid_command_syntax(project_dir: str) -> None:
    """Invalid command syntax (e.g. unclosed quotes) must be blocked."""
    assert (
        check_command('echo "unclosed quote', project_dir)
        == "BLOCKED: invalid command syntax"
    )
