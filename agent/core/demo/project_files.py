"""Demo project file generation utility."""
from __future__ import annotations

import os
from typing import Final

README_CONTENT: Final[str] = """# Demo Project
A lightweight demo project with models, utilities, and application runner.
"""

MODELS_CONTENT: Final[str] = '''"""Data models and functions."""
from dataclasses import dataclass


@dataclass
class Item:
    """Project item representation."""
    id: int
    name: str
    value: float = 0.0


def create_item(item_id: int, name: str, value: float = 0.0) -> Item:
    """Create a new Item instance."""
    return Item(id=item_id, name=name, value=value)


def validate_item(item: Item) -> bool:
    """Check item validity."""
    return item.id > 0 and bool(item.name.strip())
'''

UTILS_CONTENT: Final[str] = '''"""Helper utility functions."""
from typing import Sequence


def format_name(name: str) -> str:
    """Format and strip a name string."""
    return name.strip().title()


def sum_values(values: Sequence[float]) -> float:
    """Sum a sequence of numeric values."""
    return sum(values)
'''

APP_V1_CONTENT: Final[str] = '''"""Main application runner."""
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import models  # noqa: E402
import utils  # noqa: E402


def run_app() -> dict[str, object]:
    """Execute application and return summary."""
    item1 = models.create_item(1, utils.format_name("alpha"), 10.0)
    item2 = models.create_item(2, utils.format_name("beta"), 20.0)
    items = [item1, item2]
    return {
        "status": "ok",
        "valid": all(models.validate_item(i) for i in items),
        "total": utils.sum_values([i.value for i in items]),
        "count": len(items),
    }


if __name__ == "__main__":
    print(run_app())
'''

STORAGE_CONTENT: Final[str] = '''"""Storage backend module."""
import sqlite3
from typing import Any, Optional


class Storage:
    """SQLite-backed storage."""

    def __init__(self, db_path: str = ":memory:") -> None:
        self.conn = sqlite3.connect(db_path)
        with self.conn:
            self.conn.execute(
                "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT, value REAL)"
            )

    def save(self, item_id: int, name: str, value: float) -> None:
        """Save an item."""
        with self.conn:
            self.conn.execute(
                "INSERT OR REPLACE INTO items (id, name, value) VALUES (?, ?, ?)",
                (item_id, name, value),
            )

    def get(self, item_id: int) -> Optional[dict[str, Any]]:
        """Get an item by id."""
        cur = self.conn.cursor()
        cur.execute("SELECT id, name, value FROM items WHERE id = ?", (item_id,))
        row = cur.fetchone()
        return {"id": row[0], "name": row[1], "value": row[2]} if row else None

    def list_all(self) -> list[dict[str, Any]]:
        """List all items."""
        cur = self.conn.cursor()
        cur.execute("SELECT id, name, value FROM items ORDER BY id")
        return [{"id": r[0], "name": r[1], "value": r[2]} for r in cur.fetchall()]

    def close(self) -> None:
        """Close connection."""
        self.conn.close()
'''

TEST_APP_CONTENT: Final[str] = '''"""Tests for demo application."""
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import app  # noqa: E402
import models  # noqa: E402
import storage  # noqa: E402


def test_models() -> None:
    """Test model creation and validation."""
    item = models.create_item(1, "test", 5.0)
    assert item.id == 1 and item.value == 5.0
    assert models.validate_item(item) is True
    assert models.validate_item(models.create_item(-1, "")) is False


def test_storage_and_app() -> None:
    """Test storage persistence and app run."""
    store = storage.Storage()
    store.save(1, "widget", 15.0)
    assert store.get(1)["name"] == "widget"
    result = app.run_app(store)
    assert result["status"] == "ok"
    assert result["stored_count"] >= 2
    store.close()
'''

APP_V2_CONTENT: Final[str] = '''"""Main application runner with storage."""
import os
import sys
from typing import Optional

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import models  # noqa: E402
import storage  # noqa: E402
import utils  # noqa: E402


def run_app(store: Optional[storage.Storage] = None) -> dict[str, object]:
    """Execute application with storage and return summary."""
    if store is None:
        store = storage.Storage()
    item1 = models.create_item(1, utils.format_name("alpha"), 10.0)
    item2 = models.create_item(2, utils.format_name("beta"), 20.0)
    items = [item1, item2]
    for i in items:
        store.save(i.id, i.name, i.value)
    stored = store.list_all()
    return {
        "status": "ok",
        "valid": all(models.validate_item(i) for i in items),
        "total": utils.sum_values([i.value for i in items]),
        "count": len(items),
        "stored_count": len(stored),
    }


if __name__ == "__main__":
    print(run_app())
'''


def safe_path(project_dir: str, rel_path: str) -> str:
    """Resolve rel_path within project_dir and raise ValueError on escape."""
    abs_base = os.path.abspath(project_dir)
    target = os.path.abspath(os.path.join(abs_base, rel_path))
    try:
        common = os.path.commonpath([abs_base, target])
    except ValueError:
        raise ValueError(f"Path escape detected: {rel_path} outside {project_dir}")
    if common != abs_base or target == abs_base:
        raise ValueError(f"Path escape detected: {rel_path} outside {project_dir}")
    return target


def write_round(project_dir: str, n: int) -> list[str]:
    """Generate demo project files for round n."""
    abs_dir = os.path.abspath(project_dir)
    os.makedirs(abs_dir, exist_ok=True)

    if n == 1:
        files = [
            ("README.md", README_CONTENT),
            ("app.py", APP_V1_CONTENT),
            ("models.py", MODELS_CONTENT),
            ("utils.py", UTILS_CONTENT),
        ]
        for rel_path, content in files:
            with open(safe_path(abs_dir, rel_path), "w", encoding="utf-8") as f:
                f.write(content)
        return ["README.md", "app.py", "models.py", "utils.py"]

    if n == 2:
        files = [
            ("storage.py", STORAGE_CONTENT),
            ("test_app.py", TEST_APP_CONTENT),
            ("app.py", APP_V2_CONTENT),
        ]
        for rel_path, content in files:
            with open(safe_path(abs_dir, rel_path), "w", encoding="utf-8") as f:
                f.write(content)
        return ["storage.py", "test_app.py", "app.py"]

    return []
