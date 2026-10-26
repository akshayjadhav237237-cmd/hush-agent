"""Real desktop test: 5,000-character clipboard text round-trip."""
import random
import string
import pyperclip
import pytest

from tests_real.real_test_helper import pre_gui_warning, record_result, sha256_text


def test_real_desktop_clipboard_5000_chars() -> None:
    pre_gui_warning("Reading and writing 5,000-character payload via system clipboard", wait_seconds=3)

    original = ""
    try:
        original = pyperclip.paste()
    except Exception:
        pass

    # Generate 5,000 character diverse text payload
    characters = string.ascii_letters + string.digits + " \n\t.,;:!?-+*/=()[]{}"
    random.seed(42)
    payload = "".join(random.choice(characters) for _ in range(5000))
    expected_hash = sha256_text(payload)

    try:
        pyperclip.copy(payload)
        read_back = pyperclip.paste()
        assert len(read_back) == 5000, f"Expected 5000 chars, got {len(read_back)}"
        assert read_back == payload, "Clipboard text mismatch"

        record_result(
            feature_id="desktop-clipboard-transfer",
            status="PASS",
            detail=f"5,000-character text payload verified intact across clipboard. Length: {len(read_back)}",
            evidence_hash=expected_hash,
        )
    finally:
        # Restore clipboard
        try:
            pyperclip.copy(original)
        except Exception:
            pass
