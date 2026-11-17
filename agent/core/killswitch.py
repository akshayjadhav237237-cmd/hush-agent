"""Global hotkey kill switch monitor.

LIMITATIONS & PLATFORM SECURITY ARCHITECTURE (UIPI / UAC / LOCK SCREEN):
-----------------------------------------------------------------------
On Microsoft Windows, this module uses `ctypes.windll.user32.GetAsyncKeyState` to
detect the emergency abort hotkey (Ctrl+Alt+K) globally across applications.
Operators and engineers must be aware of the following architectural boundaries:

1. User Interface Privilege Isolation (UIPI):
   When the agent process executes at Medium Integrity (standard non-elevated user),
   Windows UIPI blocks cross-integrity input monitoring. If the user or agent activates
   an elevated application window (High Integrity / Administrator), `GetAsyncKeyState`
   may not receive keystrokes dispatched to that elevated window.

2. User Account Control (UAC) Secure Desktop:
   During UAC elevation consent/credential prompts, Windows transitions input to the
   isolated Secure Desktop. Background user processes cannot intercept keystrokes
   occurring on the Secure Desktop; hotkey detection is suspended until the UAC prompt
   is dismissed.

3. Workstation Lock Screen:
   When the workstation is locked (`Win+L`) or running a credential screensaver,
   raw keyboard input is not delivered to standard user session processes.

4. Robust Error Handling:
   To prevent unexpected ctypes or operating system errors from terminating the
   emergency stop monitor, key-state queries in the background polling loop are
   strictly wrapped in exception handlers. Any transient OS/ctypes errors are captured
   gracefully without causing silent thread death.
"""
from __future__ import annotations

import sys
import threading
import time
from typing import Callable, Optional

HOTKEY_DESCRIPTION: str = "Ctrl+Alt+K (polled at 20 Hz globally)"
VK_CONTROL: int = 0x11
VK_MENU: int = 0x12  # Alt
VK_K: int = 0x4B


def is_failsafe(exc: BaseException) -> bool:
    """Return True if exception is a pyautogui FailSafeException."""
    return type(exc).__name__ == "FailSafeException"


class KillSwitch:
    """Monitors global hotkeys to abort execution immediately."""

    def __init__(
        self,
        get_key_state: Optional[Callable[[int], int]] = None,
        poll_hz: float = 20.0,
        sleep: Callable[[float], None] = time.sleep,
        on_trigger: Optional[Callable[[], None]] = None,
    ) -> None:
        self._triggered = threading.Event()
        self._stop_event = threading.Event()
        self.poll_hz = poll_hz
        self.sleep = sleep
        self.get_key_state = get_key_state
        self._thread: Optional[threading.Thread] = None
        self._callbacks: list[Callable[[], None]] = []
        if on_trigger is not None:
            self._callbacks.append(on_trigger)
        self.last_error: Optional[Exception] = None
        self.error_count: int = 0

    def add_callback(self, callback: Callable[[], None]) -> None:
        """Register a callback to be invoked immediately when the kill switch triggers."""
        self._callbacks.append(callback)

    def _fire_callbacks(self) -> None:
        """Execute registered callbacks safely."""
        for cb in list(self._callbacks):
            try:
                cb()
            except Exception:
                pass

    def start(self) -> bool:
        """Start the background hotkey polling thread.

        Returns True if polling started (or was already running), False on unsupported
        platforms or failure to bind Win32 APIs.
        """
        if self._thread is not None and self._thread.is_alive():
            return True

        if self.get_key_state is None:
            if sys.platform != "win32":
                return False
            try:
                import ctypes

                user32 = ctypes.windll.user32
                self.get_key_state = user32.GetAsyncKeyState
            except Exception as exc:
                self.last_error = exc
                return False

        self._thread = threading.Thread(target=self._run_poll, daemon=True)
        self._thread.start()
        return True

    def is_set(self) -> bool:
        """Check if the kill switch has been triggered."""
        return self._triggered.is_set()

    def trigger(self) -> None:
        """Manually trigger the kill switch and fire registered callbacks."""
        self._triggered.set()
        self._fire_callbacks()

    def stop(self) -> None:
        """Stop the background polling thread and wait for it to exit."""
        self._stop_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.0)

    def _run_poll(self) -> None:
        """Background thread target that polls hotkey state with error resilience.

        Catches unexpected OS or ctypes errors when calling `get_key_state` so the
        polling thread does not die silently.
        """
        while not self._stop_event.is_set() and not self._triggered.is_set():
            if self.get_key_state:
                try:
                    ctrl = bool(self.get_key_state(VK_CONTROL) & 0x8000)
                    alt = bool(self.get_key_state(VK_MENU) & 0x8000)
                    k = bool(self.get_key_state(VK_K) & 0x8000)
                    if ctrl and alt and k:
                        self.trigger()
                        break
                except Exception as exc:
                    self.last_error = exc
                    self.error_count += 1
            self.sleep(1.0 / self.poll_hz)
