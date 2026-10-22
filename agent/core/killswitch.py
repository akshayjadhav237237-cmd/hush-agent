"""Global hotkey kill switch monitor."""
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
    ) -> None:
        self._triggered = threading.Event()
        self._stop_event = threading.Event()
        self.poll_hz = poll_hz
        self.sleep = sleep
        self.get_key_state = get_key_state
        self._thread: Optional[threading.Thread] = None

    def start(self) -> bool:
        """Start the background hotkey polling thread."""
        if self.get_key_state is None:
            if sys.platform != "win32":
                return False
            try:
                import ctypes

                user32 = ctypes.windll.user32
                self.get_key_state = user32.GetAsyncKeyState
            except Exception:
                return False

        self._thread = threading.Thread(target=self._run_poll, daemon=True)
        self._thread.start()
        return True

    def is_set(self) -> bool:
        """Check if the kill switch has been triggered."""
        return self._triggered.is_set()

    def trigger(self) -> None:
        """Manually trigger the kill switch."""
        self._triggered.set()

    def stop(self) -> None:
        """Stop the background polling thread and wait for it to exit."""
        self._stop_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.0)

    def _run_poll(self) -> None:
        """Background thread target that polls hotkey state."""
        while not self._stop_event.is_set() and not self._triggered.is_set():
            if self.get_key_state:
                ctrl = bool(self.get_key_state(VK_CONTROL) & 0x8000)
                alt = bool(self.get_key_state(VK_MENU) & 0x8000)
                k = bool(self.get_key_state(VK_K) & 0x8000)
                if ctrl and alt and k:
                    self._triggered.set()
                    break
            self.sleep(1.0 / self.poll_hz)
