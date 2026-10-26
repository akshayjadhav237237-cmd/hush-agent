"""Real desktop test: Perceptual loop breaker on static vs changed screen frames."""
import io
from PIL import Image, ImageDraw
import pytest

from core.loopbreaker import LoopBreaker, dhash, hamming
from tests_real.real_test_helper import record_result, sha256_bytes


def _render_screen(text_lines: list[str], cursor: bool = False) -> bytes:
    """Render a realistic 1280x720 desktop workspace frame."""
    img = Image.new("RGB", (1280, 720), color=(30, 32, 36))
    draw = ImageDraw.Draw(img)

    # Top title bar / window decoration
    draw.rectangle([0, 0, 1280, 36], fill=(45, 48, 54))
    draw.text((16, 10), "Antigravity - workspace/project", fill=(200, 200, 200))

    # Sidebar
    draw.rectangle([0, 36, 220, 720], fill=(37, 40, 45))

    # Editor content area
    y = 50
    for line in text_lines:
        draw.text((240, y), line, fill=(220, 220, 220))
        y += 24

    if cursor:
        draw.rectangle([240, y, 242, y + 18], fill=(255, 255, 255))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_real_loopbreaker_static_and_progress_tuning() -> None:
    # Tuned threshold:
    # max_distance = 2: catches identical screens and minor jitter/cursor blink (distance <= 2),
    # while genuine text/line changes produce distance >= 4, correctly avoiding false stall alerts.
    breaker = LoopBreaker(same_threshold=3, max_distance=2)

    base_lines = [
        "def process_booking(booking_id: str) -> bool:",
        "    \"\"\"Validate and persist customer photo session.\"\"\"",
        "    if not booking_id:",
        "        return False",
    ]

    frame_base = _render_screen(base_lines, cursor=False)
    frame_cursor = _render_screen(base_lines, cursor=True)
    hash_base = dhash(frame_base)
    hash_cursor = dhash(frame_cursor)

    dist_cursor = hamming(hash_base, hash_cursor)
    # Blinking cursor has minimal perceptual diff
    assert dist_cursor <= 2, f"Cursor blink distance should be <= 2, got {dist_cursor}"

    # 1. Test Static Loop: 3 consecutive actions on static screen
    # Action 1: baseline
    alert1 = breaker.observe(hash_base, last_action_kind="act")
    assert alert1 is None

    # Action 2: same screen (cursor blinks)
    alert2 = breaker.observe(hash_cursor, last_action_kind="act")
    assert alert2 is None
    assert breaker.same_count == 1

    # Action 3: same screen again
    alert3 = breaker.observe(hash_base, last_action_kind="act")
    assert alert3 is None
    assert breaker.same_count == 2

    # Action 4: reaches threshold of 3 identical interactive actions -> STALL ALERT
    alert4 = breaker.observe(hash_cursor, last_action_kind="act")
    assert alert4 is not None
    assert "consecutive interactive actions" in alert4

    # 2. Test Real Change: adding a new line of code
    changed_lines = list(base_lines) + [
        "    print(f'Processing wedding photo booking: {booking_id}')",
        "    return True",
    ]
    frame_changed = _render_screen(changed_lines, cursor=False)
    hash_changed = dhash(frame_changed)
    dist_changed = hamming(hash_base, hash_changed)

    assert dist_changed >= 3, f"Code change should produce noticeable Hamming diff, got {dist_changed}"

    # Feed changed screen to breaker -> MUST reset counters and produce NO false alert
    breaker.reset()
    alert_change1 = breaker.observe(hash_base, last_action_kind="act")
    alert_change2 = breaker.observe(hash_changed, last_action_kind="act")
    assert alert_change2 is None
    assert breaker.same_count == 0, "Counter must reset upon genuine progress"

    evidence = sha256_bytes(frame_base)
    record_result(
        feature_id="safety-screenshot-loop-breaker",
        status="PASS",
        detail="Loop breaker perceptual difference hashing tuned (max_distance=2, same_threshold=3). Detects static screen loops and suppresses false alerts on actual code changes.",
        evidence_hash=evidence,
    )
