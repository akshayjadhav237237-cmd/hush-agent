"""
Gemma 4 desktop orchestrator (Windows) - hackathon starter.
UNTESTED SKELETON: expect to tweak coordinates, timings and window titles.

Setup:
    pip install google-genai pyautogui pyperclip pygetwindow requests pillow
    setx GEMINI_API_KEY "your-key"        (reopen terminal afterwards)
    optional: setx NTFY_TOPIC "some-secret-topic"   (install the ntfy app on your phone)

Run:
    python orchestrator.py "a portfolio website for a wedding photographer"

Safety: slam the mouse into the TOP-LEFT screen corner to abort (pyautogui failsafe).
"""
import os
import sys
import time
import io
import subprocess
import webbrowser

import requests
import pyautogui
import pyperclip
from google import genai
from google.genai import types

try:
    import pygetwindow as gw
except Exception:  # pygetwindow can be flaky; focus_window will degrade gracefully
    gw = None

MODEL = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")  # or "gemma-4-31b-it"
WORKDIR = os.path.abspath("./workspace")
os.makedirs(WORKDIR, exist_ok=True)
NTFY_TOPIC = os.getenv("NTFY_TOPIC")
MAX_STEPS = 80
KEEP_SCREENSHOTS = 2          # older screenshots are dropped to save tokens
SHOT_WIDTH = 1280             # screenshots are downscaled; clicks are scaled back up

pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.4

client = genai.Client()       # reads GEMINI_API_KEY from the environment
_scale = {"v": 1.0}

# --------------------------------------------------------------------------- #
# Prompts
# --------------------------------------------------------------------------- #
CLAUDE_BOOTSTRAP = """You are the architect and prompt-writer for an automated build pipeline.
You do NOT write or run code yourself. You produce precise, self-contained instruction prompts
that a separate coding agent (Antigravity) will execute.

Rules for every prompt you write:
- State exactly what to build, which files to touch, and the acceptance criteria.
- State what NOT to do (no placeholder code, no invented APIs, no unrelated refactors).
- Split independent work into parallel tasks where the coding agent supports it.
- If something needs a human decision (credentials, payment, ambiguous requirements),
  begin your reply with the line NEEDS_HUMAN: followed by the question.

Step 1: The user wants to build: {idea}.
Write a prompt for a research agent that finds the features, UX patterns and current
React component libraries that best fit this idea. Output only that prompt."""

SYSTEM_PLAYBOOK = """You are an autonomous desktop operator running on Windows. You control the
computer ONLY through the provided tools. After any action that changes the screen, call
`screenshot` and LOOK at it before deciding the next step. Coordinates you click are in
screenshot pixel space.

GOAL: turn the user's idea into a built project by coordinating three apps:
Claude (claude.ai in Chrome) = architect, Gemini (Deep Research) = researcher,
Antigravity (desktop IDE agent) = builder.

PLAYBOOK
1. open_url https://claude.ai/new. Paste the BOOTSTRAP prompt (given below) and press Enter.
   Wait until the reply finishes. Use the copy button on the reply, then read_clipboard.
   That text is the RESEARCH_PROMPT.
2. open_url https://gemini.google.com/app. Choose Deep Research (screenshot to find it).
   Paste RESEARCH_PROMPT, submit, and confirm any "start research" button.
   Poll with wait(60) + screenshot until the report is complete. Copy it with the copy
   button / read_clipboard. That is the RESEARCH_REPORT.
3. Return to the Claude chat. Paste RESEARCH_REPORT with the instruction:
   "Finalize the architecture and give me the first build prompt for Antigravity."
   Copy the reply = BUILD_PROMPT.
4. Open Antigravity (open_app). Paste BUILD_PROMPT, submit, and wait until the agent is
   idle. Read the result on screen (and run_cmd to inspect files if useful).
5. Build the code graph with Graphify: call graph_build the first time, graph_update after
   every later round. Then call graph_report (and graph_query / graph_explain / graph_path
   for specific questions). Paste a SHORT summary plus the relevant graph findings
   (real symbol names and relationships, never invented ones) into Claude, ask for the next
   BUILD_PROMPT, and repeat step 4. Maximum 3 build rounds.
   graph_update itself alerts the human if the graph shows no change for 2 rounds in a row.

ATTENTION RULES (this is the important part)
- Keep going on your own whenever any further progress is possible without the human.
- Call notify_human ONLY if: Claude's reply begins with NEEDS_HUMAN, a login / captcha /
  payment / API key is required, a destructive action needs approval, or the same step has
  failed 3 times. Otherwise never interrupt.
- Never invent results. If you cannot see it on screen or in the clipboard, take another
  screenshot or wait.
- When all rounds are done, or the project is built, call finish.
"""

# --------------------------------------------------------------------------- #
# Tools
# --------------------------------------------------------------------------- #
BLOCKED_SUBSTRINGS = ["rm -rf", "rmdir /s", "del /s", "format ", "shutdown", "reg delete",
                      "diskpart", "powershell -enc", "curl ", "wget ", "invoke-webrequest",
                      "&&", "||", "|", ">", "<", ";"]
ALLOWED_COMMANDS = {"git", "npm", "node", "python", "pip", "dir", "type", "echo",
                    "mkdir", "cd"}


def open_app(name: str) -> str:
    pyautogui.press("win")
    time.sleep(0.8)
    pyautogui.write(name, interval=0.03)
    time.sleep(1.2)
    pyautogui.press("enter")
    time.sleep(5)
    return f"Tried to open '{name}' via the Start menu. Take a screenshot to verify."


def open_url(url: str) -> str:
    webbrowser.open(url)
    time.sleep(4)
    return f"Opened {url} in the default browser."


def focus_window(title_contains: str) -> str:
    if gw is None:
        return "pygetwindow unavailable; use alt+tab via press_keys."
    wins = gw.getWindowsWithTitle(title_contains)
    if not wins:
        return f"No window containing '{title_contains}'."
    try:
        w = wins[0]
        if w.isMinimized:
            w.restore()
        w.activate()
        time.sleep(0.8)
        return f"Focused window: {w.title}"
    except Exception as e:
        return f"Could not focus window: {e}"


def paste_text(text: str, press_enter: bool = False) -> str:
    pyperclip.copy(text)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(0.5)
    if press_enter:
        pyautogui.press("enter")
    return f"Pasted {len(text)} characters" + (" and pressed Enter." if press_enter else ".")


def press_keys(keys: str) -> str:
    pyautogui.hotkey(*[k.strip() for k in keys.split("+")])
    return f"Pressed {keys}"


def click(x: int, y: int) -> str:
    s = _scale["v"]
    pyautogui.click(int(x * s), int(y * s))
    return f"Clicked ({x},{y})"


def scroll(amount: int) -> str:
    pyautogui.scroll(amount)
    return f"Scrolled {amount}"


def read_clipboard() -> str:
    text = pyperclip.paste()
    return text[:20000] if text else "(clipboard empty)"


def wait(seconds: int) -> str:
    time.sleep(min(int(seconds), 120))
    return f"Waited {seconds}s"


def run_cmd(command: str) -> str:
    low = command.lower()
    if any(b in low for b in BLOCKED_SUBSTRINGS):
        return "BLOCKED: command contains a disallowed pattern."
    first = command.strip().split()[0].lower() if command.strip() else ""
    if first not in ALLOWED_COMMANDS:
        return f"BLOCKED: '{first}' is not in the allowlist {sorted(ALLOWED_COMMANDS)}."
    try:
        r = subprocess.run(command, shell=True, cwd=WORKDIR, capture_output=True,
                           text=True, timeout=120)
        return (r.stdout + r.stderr)[-4000:] or "(no output)"
    except subprocess.TimeoutExpired:
        return "Command timed out after 120s."


PROJECT_DIR = os.path.abspath(os.getenv("PROJECT_DIR", os.path.join(WORKDIR, "project")))
os.makedirs(PROJECT_DIR, exist_ok=True)
_graph_state = {"last_hash": None, "stalls": 0}


def _graphify(*args, timeout=300) -> str:
    """Run the Graphify CLI with a fixed argv (no shell) inside PROJECT_DIR."""
    try:
        r = subprocess.run(["graphify", *args], cwd=PROJECT_DIR, capture_output=True,
                           text=True, timeout=timeout)
        return (r.stdout + r.stderr)[-3000:].strip() or "(no output)"
    except FileNotFoundError:
        return "graphify is not installed. Install with: uv tool install graphifyy"
    except subprocess.TimeoutExpired:
        return "graphify timed out."


def _report_path() -> str:
    return os.path.join(PROJECT_DIR, "graphify-out", "GRAPH_REPORT.md")


def graph_build() -> str:
    out = [_graphify("extract", ".", "--code-only"),
           _graphify("cluster-only", ".", "--no-label"),
           _graphify("export", "html")]
    return "\n".join(out) + "\nGraph HTML: " + os.path.join(PROJECT_DIR, "graphify-out", "graph.html")


def graph_update() -> str:
    out = _graphify("update", ".") + "\n" + _graphify("export", "html")
    # Code-enforced no-progress gate: identical graph report twice in a row -> alert the human.
    try:
        import hashlib
        with open(_report_path(), "rb") as f:
            h = hashlib.sha256(f.read()).hexdigest()
        if h == _graph_state["last_hash"]:
            _graph_state["stalls"] += 1
        else:
            _graph_state["stalls"] = 0
        _graph_state["last_hash"] = h
        if _graph_state["stalls"] >= 2:
            out += "\n" + notify_human(
                "The code graph has not changed for 2 rounds in a row. The build may be stuck.")
    except FileNotFoundError:
        out += "\n(no GRAPH_REPORT.md found; run graph_build first)"
    return out


def graph_report() -> str:
    try:
        with open(_report_path(), encoding="utf-8") as f:
            return f.read()[:6000]
    except FileNotFoundError:
        return "No report yet. Call graph_build first."


def graph_query(question: str) -> str:
    return _graphify("query", question)


def graph_explain(symbol: str) -> str:
    return _graphify("explain", symbol)


def graph_path(source: str, target: str) -> str:
    return _graphify("path", source, target)


def notify_human(message: str) -> str:
    print(f"\n[!] ATTENTION NEEDED: {message}\n")
    if NTFY_TOPIC:
        try:
            requests.post(f"https://ntfy.sh/{NTFY_TOPIC}", data=message.encode("utf-8"),
                          headers={"Title": "Agent needs you"}, timeout=10)
        except Exception as e:
            print("ntfy failed:", e)
    reply = input("Type your answer / instruction and press Enter to resume: ")
    return f"Human replied: {reply}"


TOOL_FUNCS = {
    "open_app": open_app, "open_url": open_url, "focus_window": focus_window,
    "paste_text": paste_text, "press_keys": press_keys, "click": click, "scroll": scroll,
    "read_clipboard": read_clipboard, "wait": wait, "run_cmd": run_cmd,
    "notify_human": notify_human,
    "graph_build": graph_build, "graph_update": graph_update, "graph_report": graph_report,
    "graph_query": graph_query, "graph_explain": graph_explain, "graph_path": graph_path,
}


def _decl(name, desc, props=None, required=None):
    return types.FunctionDeclaration(
        name=name, description=desc,
        parameters={"type": "object", "properties": props or {}, "required": required or []},
    )


S, I, B = {"type": "string"}, {"type": "integer"}, {"type": "boolean"}
TOOLS = types.Tool(function_declarations=[
    _decl("open_app", "Open a desktop app through the Windows Start menu.", {"name": S}, ["name"]),
    _decl("open_url", "Open a URL in the default browser.", {"url": S}, ["url"]),
    _decl("focus_window", "Bring a window to the front by (part of) its title.",
          {"title_contains": S}, ["title_contains"]),
    _decl("paste_text", "Paste text into the focused input via the clipboard.",
          {"text": S, "press_enter": B}, ["text"]),
    _decl("press_keys", "Press a hotkey such as 'ctrl+l' or 'enter'.", {"keys": S}, ["keys"]),
    _decl("click", "Click at screenshot pixel coordinates.", {"x": I, "y": I}, ["x", "y"]),
    _decl("scroll", "Scroll the mouse wheel; negative scrolls down.", {"amount": I}, ["amount"]),
    _decl("screenshot", "Take a screenshot of the whole screen and look at it."),
    _decl("read_clipboard", "Return the current clipboard text (use after clicking a copy button)."),
    _decl("wait", "Sleep for N seconds (max 120).", {"seconds": I}, ["seconds"]),
    _decl("run_cmd", "Run an allowlisted command inside the project workspace folder.",
          {"command": S}, ["command"]),
    _decl("graph_build", "Build the Graphify code graph of the project folder (first time)."),
    _decl("graph_update", "Refresh the Graphify graph after a build round; alerts the human if nothing changed twice."),
    _decl("graph_report", "Read the Graphify graph report for the project."),
    _decl("graph_query", "Ask the Graphify graph a question about the code.", {"question": S}, ["question"]),
    _decl("graph_explain", "Explain one symbol using the Graphify graph.", {"symbol": S}, ["symbol"]),
    _decl("graph_path", "Find the connection path between two symbols in the Graphify graph.",
          {"source": S, "target": S}, ["source", "target"]),
    _decl("notify_human", "Alert the human and wait for their answer. Use sparingly.",
          {"message": S}, ["message"]),
    _decl("finish", "Declare the whole task complete with a short summary.",
          {"summary": S}, ["summary"]),
])


def take_screenshot_part() -> types.Part:
    img = pyautogui.screenshot()
    w, h = img.size
    _scale["v"] = w / SHOT_WIDTH
    img = img.resize((SHOT_WIDTH, int(h / _scale["v"])))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return types.Part.from_bytes(data=buf.getvalue(), mime_type="image/png")


def strip_old_images(contents, keep=KEEP_SCREENSHOTS):
    seen = 0
    for content in reversed(contents):
        for i, part in enumerate(content.parts):
            if getattr(part, "inline_data", None) is not None:
                seen += 1
                if seen > keep:
                    content.parts[i] = types.Part.from_text(text="[old screenshot removed]")


# --------------------------------------------------------------------------- #
# Main loop
# --------------------------------------------------------------------------- #
def main(idea: str):
    first_msg = (
        SYSTEM_PLAYBOOK
        + "\n\nBOOTSTRAP prompt to paste into Claude (fill-in already done):\n<<<\n"
        + CLAUDE_BOOTSTRAP.format(idea=idea)
        + "\n>>>\n\nUser idea: " + idea + "\nStart now. Take a screenshot first."
    )
    # Instructions go in the first user turn (safest across Gemma API versions).
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=first_msg)])]
    config = types.GenerateContentConfig(
        tools=[TOOLS],
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )

    for step in range(1, MAX_STEPS + 1):
        resp = client.models.generate_content(model=MODEL, contents=contents, config=config)
        model_content = resp.candidates[0].content
        contents.append(model_content)

        calls = [p.function_call for p in model_content.parts if getattr(p, "function_call", None)]
        text = "".join(p.text for p in model_content.parts
                       if getattr(p, "text", None) and not getattr(p, "thought", False))
        if text:
            print(f"[{step}] Gemma: {text.strip()[:300]}")
        if not calls:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(
                text="Continue with the playbook using a tool call, or call finish if done.")]))
            continue

        reply_parts, want_shot = [], False
        for fc in calls:
            args = dict(fc.args or {})
            print(f"[{step}] -> {fc.name}({str(args)[:120]})")
            if fc.name == "finish":
                print("\nDONE:", args.get("summary"))
                return
            if fc.name == "screenshot":
                want_shot, result = True, "Screenshot attached below."
            elif fc.name in TOOL_FUNCS:
                try:
                    result = TOOL_FUNCS[fc.name](**args)
                except Exception as e:
                    result = f"ERROR: {e}"
            else:
                result = f"Unknown tool {fc.name}"
            reply_parts.append(types.Part(function_response=types.FunctionResponse(
                id=getattr(fc, "id", None), name=fc.name, response={"result": result})))

        if want_shot:
            reply_parts.append(take_screenshot_part())
        contents.append(types.Content(role="user", parts=reply_parts))
        strip_old_images(contents)

    print("Hit MAX_STEPS without finishing.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit('Usage: python orchestrator.py "what you want built"')
    main(" ".join(sys.argv[1:]))
