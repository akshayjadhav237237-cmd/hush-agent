"""Synthetic screen generation for demo mode."""
from __future__ import annotations

import io
from typing import Any

WIDTH: int = 1280
HEIGHT: int = 720
SUPPORTED_APPS: set[str] = {"desktop", "claude", "gemini", "antigravity"}

_PALETTES: dict[str, dict[str, tuple[int, int, int]]] = {
    "antigravity": {
        "bg": (15, 23, 42),
        "header_bg": (30, 41, 59),
        "header_border": (51, 65, 85),
        "header_text": (56, 189, 248),
        "text": (226, 232, 240),
        "subtext": (148, 163, 184),
        "button_bg": (30, 41, 59),
        "button_border": (14, 165, 233),
        "button_text": (240, 249, 255),
        "footer_bg": (15, 23, 42),
        "footer_border": (30, 41, 59),
        "footer_text": (100, 116, 139),
    },
    "claude": {
        "bg": (250, 246, 238),
        "header_bg": (237, 230, 219),
        "header_border": (218, 208, 192),
        "header_text": (197, 86, 52),
        "text": (45, 39, 36),
        "subtext": (120, 110, 102),
        "button_bg": (235, 226, 213),
        "button_border": (197, 86, 52),
        "button_text": (45, 39, 36),
        "footer_bg": (245, 240, 230),
        "footer_border": (218, 208, 192),
        "footer_text": (140, 130, 122),
    },
    "gemini": {
        "bg": (19, 27, 46),
        "header_bg": (27, 42, 71),
        "header_border": (41, 60, 97),
        "header_text": (138, 180, 248),
        "text": (225, 231, 245),
        "subtext": (154, 172, 204),
        "button_bg": (30, 48, 86),
        "button_border": (66, 133, 244),
        "button_text": (235, 242, 255),
        "footer_bg": (19, 27, 46),
        "footer_border": (27, 42, 71),
        "footer_text": (102, 124, 161),
    },
    "desktop": {
        "bg": (24, 24, 27),
        "header_bg": (39, 39, 42),
        "header_border": (63, 63, 70),
        "header_text": (244, 244, 245),
        "text": (228, 228, 231),
        "subtext": (161, 161, 170),
        "button_bg": (63, 63, 70),
        "button_border": (113, 113, 122),
        "button_text": (250, 250, 250),
        "footer_bg": (24, 24, 27),
        "footer_border": (39, 39, 42),
        "footer_text": (113, 113, 122),
    },
}


def render_screen(app: str, state: dict[str, Any] | None = None) -> bytes:
    """Render synthetic PNG display bytes (1280x720) for the specified app."""
    from PIL import Image, ImageDraw, ImageFont

    if state is None:
        state = {}

    app_key = app.strip().lower() if app else "desktop"
    palette = _PALETTES.get(app_key, _PALETTES["desktop"])

    img = Image.new("RGB", (WIDTH, HEIGHT), color=palette["bg"])
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()

    # 1. Header with app title: e.g. [HUSH DEMO] App: {app.upper()}
    header_height = 50
    draw.rectangle((0, 0, WIDTH, header_height), fill=palette["header_bg"])
    draw.line((0, header_height, WIDTH, header_height), fill=palette["header_border"], width=1)

    app_title = app.upper() if app else "DESKTOP"
    header_text = f"[HUSH DEMO] App: {app_title}"
    draw.text((25, 18), header_text, fill=palette["header_text"], font=font)

    status_label = "SIMULATED DESKTOP"
    status_len = draw.textlength(status_label, font=font)
    draw.text((WIDTH - int(status_len) - 25, 18), status_label, fill=palette["subtext"], font=font)

    # 2. Draw text lines from state.get("lines", [])
    raw_lines = state.get("lines", [])
    if isinstance(raw_lines, (list, tuple)):
        lines = [str(line) for line in raw_lines]
    else:
        lines = [str(raw_lines)]

    line_y = 80
    line_spacing = 22
    max_line_y = 590
    for line in lines:
        for subline in line.splitlines():
            if line_y > max_line_y:
                break
            draw.text((40, line_y), subline, fill=palette["text"], font=font)
            line_y += line_spacing

    # 3. Draw interactive buttons labeled with their keyboard shortcuts
    raw_buttons = state.get("buttons")
    if raw_buttons is None:
        buttons = ["[F1] Run", "[F2] Copy reply", "[Enter] Submit"]
    elif isinstance(raw_buttons, (list, tuple)):
        buttons = [str(btn) for btn in raw_buttons]
    else:
        buttons = [str(raw_buttons)]

    btn_x = 40
    btn_y1 = 615
    btn_y2 = 655
    for btn_label in buttons:
        btn_str = str(btn_label)
        text_w = draw.textlength(btn_str, font=font)
        btn_w = max(110, int(text_w) + 28)
        if btn_x + btn_w > WIDTH - 40:
            break
        draw.rounded_rectangle(
            (btn_x, btn_y1, btn_x + btn_w, btn_y2),
            radius=6,
            fill=palette["button_bg"],
            outline=palette["button_border"],
            width=1,
        )
        tx = btn_x + (btn_w - text_w) / 2
        ty = btn_y1 + (btn_y2 - btn_y1 - 11) / 2
        draw.text((tx, ty), btn_str, fill=palette["button_text"], font=font)
        btn_x += btn_w + 16

    # 4. Draw "DEMO MODE" footer at the bottom
    footer_y1 = 680
    footer_y2 = HEIGHT
    draw.rectangle((0, footer_y1, WIDTH, footer_y2), fill=palette["footer_bg"])
    draw.line((0, footer_y1, WIDTH, footer_y1), fill=palette["footer_border"], width=1)

    footer_text = "DEMO MODE - Simulated desktop for testing and evaluation"
    foot_w = draw.textlength(footer_text, font=font)
    foot_x = (WIDTH - foot_w) / 2
    foot_y = footer_y1 + (footer_y2 - footer_y1 - 11) / 2
    draw.text((foot_x, foot_y), footer_text, fill=palette["footer_text"], font=font)

    # 5. Encodes to PNG in io.BytesIO() and returns raw PNG bytes
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
