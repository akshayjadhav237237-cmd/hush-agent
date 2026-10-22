"""Tests for the loopbreaker module."""
from __future__ import annotations

import io
from core.loopbreaker import (
    DEFAULT_MAX_DISTANCE,
    DEFAULT_SAME_THRESHOLD,
    DEFAULT_WAIT_THRESHOLD,
    LoopBreaker,
    action_kind,
    dhash,
    hamming,
)


def _make_test_png(pattern: str = "gradient") -> bytes:
    """Generate synthetic PNG image bytes for testing."""
    from PIL import Image

    if pattern == "gradient":
        img = Image.new("L", (16, 16))
        for y in range(16):
            for x in range(16):
                img.putpixel((x, y), (16 - x) * 15)
    elif pattern == "reverse":
        img = Image.new("L", (16, 16))
        for y in range(16):
            for x in range(16):
                img.putpixel((x, y), x * 15)
    else:
        img = Image.new("L", (16, 16), color=128)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_action_kind() -> None:
    """Verify action_kind categorizes interactive, wait, and other actions."""
    interactive = [
        "click",
        "press_keys",
        "paste_text",
        "paste_artifact",
        "open_app",
        "open_url",
        "focus_window",
        "scroll",
    ]
    for act in interactive:
        assert action_kind(act) == "act"

    assert action_kind("wait") == "wait"
    assert action_kind("run_cmd") == "other"
    assert action_kind("bash") == "other"
    assert action_kind("screenshot") == "other"
    assert action_kind("") == "other"


def test_hamming_distance() -> None:
    """Verify hamming counts differing bits correctly."""
    assert hamming(0, 0) == 0
    assert hamming(0b1010, 0b1010) == 0
    assert hamming(0b1010, 0b0101) == 4
    assert hamming(0, 0xFFFFFFFFFFFFFFFF) == 64
    assert hamming(1 << 12, 0) == 1
    assert hamming(0b11110000, 0b00001111) == 8


def test_dhash_synthetic_png() -> None:
    """Verify dhash generates a 64-bit integer from PNG bytes."""
    png_grad = _make_test_png("gradient")
    hash_val = dhash(png_grad)

    assert isinstance(hash_val, int)
    assert 0 <= hash_val <= 0xFFFFFFFFFFFFFFFF

    # Same image produces identical hash
    assert dhash(png_grad) == hash_val

    # Reverse gradient produces a different hash
    png_rev = _make_test_png("reverse")
    hash_rev = dhash(png_rev)
    assert hash_rev != hash_val


def test_loopbreaker_act_threshold() -> None:
    """Verify identical hashes after 'act' trip reason at same_threshold."""
    breaker = LoopBreaker(same_threshold=3)
    assert breaker.observe(12345, "act") is None
    assert breaker.same_count == 0

    assert breaker.observe(12345, "act") is None
    assert breaker.same_count == 1

    assert breaker.observe(12345, "act") is None
    assert breaker.same_count == 2

    reason = breaker.observe(12345, "act")
    assert breaker.same_count == 3
    assert reason == "Screen remained static across 3 consecutive interactive actions."


def test_loopbreaker_wait_threshold() -> None:
    """Verify identical hashes after 'wait' trip only at wait_threshold."""
    breaker = LoopBreaker(wait_threshold=15)
    assert breaker.observe(54321, "wait") is None
    assert breaker.wait_count == 0

    for i in range(1, 15):
        assert breaker.observe(54321, "wait") is None
        assert breaker.wait_count == i

    reason = breaker.observe(54321, "wait")
    assert breaker.wait_count == 15
    assert reason == "Screen remained static across 15 consecutive wait intervals."


def test_loopbreaker_significant_change_resets_counters() -> None:
    """Verify distance > max_distance resets counters."""
    breaker = LoopBreaker(max_distance=4)
    breaker.observe(0, "act")
    breaker.observe(0, "act")
    assert breaker.same_count == 1

    breaker.observe(0, "wait")
    assert breaker.wait_count == 1

    # 0xFF has 8 differing bits (> 4)
    result = breaker.observe(0xFF, "act")
    assert result is None
    assert breaker.same_count == 0
    assert breaker.wait_count == 0
    assert breaker.last_hash == 0xFF


def test_loopbreaker_other_action_leaves_counts_unchanged() -> None:
    """Verify 'other' action preserves counters."""
    breaker = LoopBreaker()
    breaker.observe(100, "act")
    breaker.observe(100, "act")
    assert breaker.same_count == 1
    assert breaker.wait_count == 0

    res1 = breaker.observe(100, "other")
    assert res1 is None
    assert breaker.same_count == 1
    assert breaker.wait_count == 0

    res2 = breaker.observe(100, "run_cmd")
    assert res2 is None
    assert breaker.same_count == 1
    assert breaker.wait_count == 0


def test_loopbreaker_reset() -> None:
    """Verify reset clears all state."""
    breaker = LoopBreaker()
    breaker.observe(42, "act")
    breaker.observe(42, "act")
    breaker.observe(42, "wait")
    assert breaker.same_count == 1
    assert breaker.wait_count == 1
    assert breaker.last_hash == 42

    breaker.reset()
    assert breaker.same_count == 0
    assert breaker.wait_count == 0
    assert breaker.last_hash is None


def test_loopbreaker_near_identical_tolerance() -> None:
    """Verify small bit differences within max_distance count as similar."""
    breaker = LoopBreaker(max_distance=DEFAULT_MAX_DISTANCE)
    breaker.observe(0b00000000, "act")

    # 3 bits difference <= 4 max_distance
    reason = breaker.observe(0b00000111, "act")
    assert reason is None
    assert breaker.same_count == 1
    assert breaker.last_hash == 0b00000111
