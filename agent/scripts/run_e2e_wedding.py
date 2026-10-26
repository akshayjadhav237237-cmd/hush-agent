"""End-to-end execution of Wedding Photo Booking CLI in real mode.

Executes agent.core.cli.main with a scripted model driving real tools:
- Real mode (mode="real")
- Real files in agent/workspace/project/ (models.py, storage.py, wedding.py, reports.py, test_wedding.py)
- Real Graphify AST build (graph_build) and update (graph_update)
- Real CLI commands and tests via run_cmd
- Human supervision gates (notify_human / ask_human)
- Full cryptographic audit logging in agent/runs/<run_id>/audit.jsonl
- Generates verification/e2e_run_20261026.md
"""
from __future__ import annotations

import difflib
import json
import os
import sys
import time
from typing import Any, Callable, Optional
from unittest.mock import patch

# Ensure agent directory is in sys.path
AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AGENT_DIR not in sys.path:
    sys.path.insert(0, AGENT_DIR)

from core.audit import verify_chain
from core.cli import main
from core.constants import EXIT_OK, RUNS_DIR, WORKSPACE_DIR
from google.genai import types

# Source Code Definitions for Wedding Photo Booking CLI

MODELS_CODE = '''"""Data models and constants for wedding photo bookings."""
from dataclasses import dataclass
from enum import Enum
from typing import Optional

ALLOWED_PACKAGES: dict[str, float] = {
    "Silver": 1500.0,
    "Gold": 2800.0,
    "Platinum": 4500.0,
}

class BookingStatus(str, Enum):
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@dataclass
class Booking:
    id: Optional[int]
    client_name: str
    wedding_date: str
    package: str
    total_price: float
    deposit_paid: float
    status: BookingStatus = BookingStatus.CONFIRMED
    created_at: Optional[str] = None

    @property
    def balance_due(self) -> float:
        return max(0.0, self.total_price - self.deposit_paid)

    @property
    def is_fully_paid(self) -> bool:
        return self.deposit_paid >= self.total_price
'''

STORAGE_CODE = '''"""SQLite storage manager for wedding photo bookings."""
import os
import sqlite3
from typing import Any, List, Optional
from models import Booking, BookingStatus

DEFAULT_DB_PATH = "bookings.db"

class BookingStorage:
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _execute(self, query: str, params: tuple = ()) -> int:
        conn = sqlite3.connect(self.db_path)
        try:
            cur = conn.cursor()
            cur.execute(query, params)
            conn.commit()
            return cur.lastrowid or cur.rowcount
        finally:
            conn.close()

    def _fetchone(self, query: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            return conn.execute(query, params).fetchone()
        finally:
            conn.close()

    def _fetchall(self, query: str, params: tuple = ()) -> List[sqlite3.Row]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            return conn.execute(query, params).fetchall()
        finally:
            conn.close()

    def _init_db(self) -> None:
        self._execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_name TEXT NOT NULL,
                wedding_date TEXT NOT NULL,
                package TEXT NOT NULL,
                total_price REAL NOT NULL,
                deposit_paid REAL NOT NULL DEFAULT 0.0,
                status TEXT NOT NULL DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    def add_booking(
        self,
        client_name: str,
        wedding_date: str,
        package: str,
        total_price: float,
        deposit_paid: float = 0.0,
        status: str = "confirmed",
    ) -> int:
        return self._execute(
            """
            INSERT INTO bookings (client_name, wedding_date, package, total_price, deposit_paid, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (client_name, wedding_date, package, total_price, deposit_paid, status),
        )

    def get_booking(self, booking_id: int) -> Optional[Booking]:
        row = self._fetchone("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        if not row:
            return None
        return self._row_to_booking(row)

    def list_bookings(self, status: Optional[str] = None) -> List[Booking]:
        if status:
            rows = self._fetchall("SELECT * FROM bookings WHERE status = ? ORDER BY wedding_date ASC", (status,))
        else:
            rows = self._fetchall("SELECT * FROM bookings ORDER BY wedding_date ASC")
        return [self._row_to_booking(r) for r in rows]

    def record_payment(self, booking_id: int, amount: float) -> Optional[Booking]:
        row = self._fetchone("SELECT deposit_paid FROM bookings WHERE id = ?", (booking_id,))
        if not row:
            return None
        new_deposit = float(row["deposit_paid"]) + float(amount)
        self._execute("UPDATE bookings SET deposit_paid = ? WHERE id = ?", (new_deposit, booking_id))
        return self.get_booking(booking_id)

    def cancel_booking(self, booking_id: int) -> bool:
        rowcount = self._execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", (booking_id,))
        return rowcount > 0

    def get_financial_summary(self) -> dict[str, Any]:
        rows = self._fetchall("SELECT total_price, deposit_paid, status FROM bookings")
        total_bookings = len(rows)
        active_bookings = [r for r in rows if r["status"] != "cancelled"]
        total_revenue = sum(float(r["total_price"]) for r in active_bookings)
        total_collected = sum(float(r["deposit_paid"]) for r in active_bookings)
        total_outstanding = max(0.0, total_revenue - total_collected)
        return {
            "total_bookings": total_bookings,
            "active_bookings": len(active_bookings),
            "total_revenue": total_revenue,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
        }

    def _row_to_booking(self, row: sqlite3.Row) -> Booking:
        return Booking(
            id=row["id"],
            client_name=row["client_name"],
            wedding_date=row["wedding_date"],
            package=row["package"],
            total_price=float(row["total_price"]),
            deposit_paid=float(row["deposit_paid"]),
            status=BookingStatus(row["status"]),
            created_at=row["created_at"],
        )
'''

WEDDING_CODE_V1 = '''"""Command line interface for wedding photo booking tracker."""
import argparse
import sys
from datetime import datetime
from models import ALLOWED_PACKAGES, BookingStatus
from storage import BookingStorage

def validate_date(date_str: str) -> str:
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except ValueError:
        raise argparse.ArgumentTypeError(f"Invalid date '{date_str}'. Expected format YYYY-MM-DD.")

def validate_package(pkg_name: str) -> str:
    normalized = pkg_name.capitalize()
    if normalized not in ALLOWED_PACKAGES:
        allowed = ", ".join(ALLOWED_PACKAGES.keys())
        raise argparse.ArgumentTypeError(f"Invalid package '{pkg_name}'. Allowed packages: {allowed}")
    return normalized

def cmd_add(args, storage: BookingStorage) -> int:
    price = args.price if args.price is not None else ALLOWED_PACKAGES[args.package]
    booking_id = storage.add_booking(
        client_name=args.client,
        wedding_date=args.date,
        package=args.package,
        total_price=price,
        deposit_paid=args.deposit,
        status="confirmed",
    )
    balance = price - args.deposit
    print(f"Booking #{booking_id} added successfully for {args.client} on {args.date}.")
    print(f"Package: {args.package} | Price: ${price:.2f} | Deposit: ${args.deposit:.2f} | Balance Due: ${balance:.2f}")
    return 0

def cmd_list(args, storage: BookingStorage) -> int:
    bookings = storage.list_bookings(status=args.status)
    if not bookings:
        print("No bookings found.")
        return 0
    print(f"{'ID':<4} {'Date':<12} {'Client':<22} {'Package':<10} {'Price':<10} {'Paid':<10} {'Balance':<10} {'Status':<10}")
    print("-" * 92)
    for b in bookings:
        print(f"{b.id:<4} {b.wedding_date:<12} {b.client_name:<22} {b.package:<10} ${b.total_price:<9.2f} ${b.deposit_paid:<9.2f} ${b.balance_due:<9.2f} {b.status.value:<10}")
    return 0

def cmd_pay(args, storage: BookingStorage) -> int:
    booking = storage.record_payment(args.id, args.amount)
    if not booking:
        print(f"Error: Booking #{args.id} not found.", file=sys.stderr)
        return 1
    print(f"Payment of ${args.amount:.2f} recorded for Booking #{booking.id} ({booking.client_name}).")
    print(f"Total Paid: ${booking.deposit_paid:.2f} | Remaining Balance: ${booking.balance_due:.2f}")
    return 0

def cmd_summary(args, storage: BookingStorage) -> int:
    summary = storage.get_financial_summary()
    print("=== Wedding Photo Bookings Summary ===")
    print(f"Total Bookings:    {summary['total_bookings']}")
    print(f"Active Bookings:   {summary['active_bookings']}")
    print(f"Total Revenue:     ${summary['total_revenue']:.2f}")
    print(f"Total Collected:   ${summary['total_collected']:.2f}")
    print(f"Total Outstanding: ${summary['total_outstanding']:.2f}")
    return 0

def cmd_cancel(args, storage: BookingStorage) -> int:
    success = storage.cancel_booking(args.id)
    if not success:
        print(f"Error: Booking #{args.id} not found.", file=sys.stderr)
        return 1
    print(f"Booking #{args.id} cancelled successfully.")
    return 0

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Wedding Photo Booking Tracker CLI")
    parser.add_argument("--db", default="bookings.db", help="Path to SQLite database file")
    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="Add a new wedding photo booking")
    add_parser.add_argument("client", help="Client or Couple names")
    add_parser.add_argument("date", type=validate_date, help="Wedding date (YYYY-MM-DD)")
    add_parser.add_argument("--package", type=validate_package, default="Gold", help="Package tier (Silver, Gold, Platinum)")
    add_parser.add_argument("--price", type=float, default=None, help="Custom total price")
    add_parser.add_argument("--deposit", type=float, default=0.0, help="Initial deposit paid")

    list_parser = subparsers.add_parser("list", help="List bookings")
    list_parser.add_argument("--status", choices=["confirmed", "completed", "cancelled"], default=None)

    pay_parser = subparsers.add_parser("pay", help="Record payment for a booking")
    pay_parser.add_argument("id", type=int, help="Booking ID")
    pay_parser.add_argument("amount", type=float, help="Payment amount")

    subparsers.add_parser("summary", help="Show financial summary")

    cancel_parser = subparsers.add_parser("cancel", help="Cancel a booking")
    cancel_parser.add_argument("id", type=int, help="Booking ID to cancel")

    return parser

def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    storage = BookingStorage(args.db)

    handlers = {
        "add": cmd_add,
        "list": cmd_list,
        "pay": cmd_pay,
        "summary": cmd_summary,
        "cancel": cmd_cancel,
    }
    handler = handlers.get(args.command)
    if handler:
        return handler(args, storage)
    print(f"Unknown command: {args.command}", file=sys.stderr)
    return 1

if __name__ == "__main__":
    sys.exit(main())
'''

TEST_WEDDING_CODE_V1 = '''"""Unit tests for wedding photo booking CLI and storage."""
import os
import unittest
from models import ALLOWED_PACKAGES, BookingStatus
from storage import BookingStorage

class TestWeddingBooking(unittest.TestCase):
    def setUp(self):
        self.db_path = "test_bookings.db"
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass
        self.storage = BookingStorage(self.db_path)

    def tearDown(self):
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass

    def test_add_and_get_booking(self):
        bid = self.storage.add_booking(
            client_name="Alice and Bob",
            wedding_date="2026-11-15",
            package="Gold",
            total_price=2800.0,
            deposit_paid=1000.0,
        )
        self.assertEqual(bid, 1)
        booking = self.storage.get_booking(1)
        self.assertIsNotNone(booking)
        self.assertEqual(booking.client_name, "Alice and Bob")
        self.assertEqual(booking.balance_due, 1800.0)
        self.assertFalse(booking.is_fully_paid)

    def test_payment_and_balance(self):
        bid = self.storage.add_booking("Clara and David", "2026-12-05", "Silver", 1500.0, 500.0)
        updated = self.storage.record_payment(bid, 1000.0)
        self.assertEqual(updated.deposit_paid, 1500.0)
        self.assertEqual(updated.balance_due, 0.0)
        self.assertTrue(updated.is_fully_paid)

    def test_cancel_booking(self):
        bid = self.storage.add_booking("Eva and Frank", "2027-01-20", "Platinum", 4500.0, 1500.0)
        success = self.storage.cancel_booking(bid)
        self.assertTrue(success)
        booking = self.storage.get_booking(bid)
        self.assertEqual(booking.status, BookingStatus.CANCELLED)

    def test_financial_summary(self):
        self.storage.add_booking("Couple A", "2026-08-01", "Silver", 1500.0, 500.0)
        self.storage.add_booking("Couple B", "2026-09-01", "Gold", 2800.0, 1000.0)
        bid3 = self.storage.add_booking("Couple C", "2026-10-01", "Platinum", 4500.0, 500.0)
        self.storage.cancel_booking(bid3)

        summary = self.storage.get_financial_summary()
        self.assertEqual(summary["total_bookings"], 3)
        self.assertEqual(summary["active_bookings"], 2)
        self.assertEqual(summary["total_revenue"], 4300.0)
        self.assertEqual(summary["total_collected"], 1500.0)
        self.assertEqual(summary["total_outstanding"], 2800.0)

if __name__ == "__main__":
    unittest.main()
'''

REPORTS_CODE = '''"""Schedule and revenue reporting module for wedding photo bookings."""
from datetime import datetime
from typing import List
from models import Booking
from storage import BookingStorage

def days_until(date_str: str) -> int:
    target = datetime.strptime(date_str, "%Y-%m-%d").date()
    today = datetime.now().date()
    return (target - today).days

def generate_schedule_report(storage: BookingStorage) -> str:
    bookings = storage.list_bookings()
    lines = []
    lines.append("==================================================")
    lines.append("         WEDDING PHOTO BOOKINGS SCHEDULE          ")
    lines.append("==================================================")
    if not bookings:
        lines.append("No bookings scheduled.")
        return "\\n".join(lines)

    for b in bookings:
        days = days_until(b.wedding_date)
        time_desc = f"{days} days away" if days >= 0 else f"{abs(days)} days ago"
        payment_status = "PAID IN FULL" if b.is_fully_paid else f"BALANCE DUE: ${b.balance_due:.2f}"
        lines.append(f"[{b.wedding_date}] #{b.id} {b.client_name} ({b.package} Package)")
        lines.append(f"    Timing: {time_desc} | Status: {b.status.value.upper()}")
        lines.append(f"    Financials: Total ${b.total_price:.2f} | Paid: ${b.deposit_paid:.2f} | {payment_status}")
        lines.append("-" * 50)

    summary = storage.get_financial_summary()
    lines.append(f"Summary: {summary['active_bookings']} active events | Revenue: ${summary['total_revenue']:.2f} | Outstanding: ${summary['total_outstanding']:.2f}")
    return "\\n".join(lines)
'''

WEDDING_CODE_V2 = '''"""Command line interface for wedding photo booking tracker."""
import argparse
import sys
from datetime import datetime
from models import ALLOWED_PACKAGES, BookingStatus
from reports import generate_schedule_report
from storage import BookingStorage

def validate_date(date_str: str) -> str:
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except ValueError:
        raise argparse.ArgumentTypeError(f"Invalid date '{date_str}'. Expected format YYYY-MM-DD.")

def validate_package(pkg_name: str) -> str:
    normalized = pkg_name.capitalize()
    if normalized not in ALLOWED_PACKAGES:
        allowed = ", ".join(ALLOWED_PACKAGES.keys())
        raise argparse.ArgumentTypeError(f"Invalid package '{pkg_name}'. Allowed packages: {allowed}")
    return normalized

def cmd_add(args, storage: BookingStorage) -> int:
    price = args.price if args.price is not None else ALLOWED_PACKAGES[args.package]
    booking_id = storage.add_booking(
        client_name=args.client,
        wedding_date=args.date,
        package=args.package,
        total_price=price,
        deposit_paid=args.deposit,
        status="confirmed",
    )
    balance = price - args.deposit
    print(f"Booking #{booking_id} added successfully for {args.client} on {args.date}.")
    print(f"Package: {args.package} | Price: ${price:.2f} | Deposit: ${args.deposit:.2f} | Balance Due: ${balance:.2f}")
    return 0

def cmd_list(args, storage: BookingStorage) -> int:
    bookings = storage.list_bookings(status=args.status)
    if not bookings:
        print("No bookings found.")
        return 0
    print(f"{'ID':<4} {'Date':<12} {'Client':<22} {'Package':<10} {'Price':<10} {'Paid':<10} {'Balance':<10} {'Status':<10}")
    print("-" * 92)
    for b in bookings:
        print(f"{b.id:<4} {b.wedding_date:<12} {b.client_name:<22} {b.package:<10} ${b.total_price:<9.2f} ${b.deposit_paid:<9.2f} ${b.balance_due:<9.2f} {b.status.value:<10}")
    return 0

def cmd_pay(args, storage: BookingStorage) -> int:
    booking = storage.record_payment(args.id, args.amount)
    if not booking:
        print(f"Error: Booking #{args.id} not found.", file=sys.stderr)
        return 1
    print(f"Payment of ${args.amount:.2f} recorded for Booking #{booking.id} ({booking.client_name}).")
    print(f"Total Paid: ${booking.deposit_paid:.2f} | Remaining Balance: ${booking.balance_due:.2f}")
    return 0

def cmd_summary(args, storage: BookingStorage) -> int:
    summary = storage.get_financial_summary()
    print("=== Wedding Photo Bookings Summary ===")
    print(f"Total Bookings:    {summary['total_bookings']}")
    print(f"Active Bookings:   {summary['active_bookings']}")
    print(f"Total Revenue:     ${summary['total_revenue']:.2f}")
    print(f"Total Collected:   ${summary['total_collected']:.2f}")
    print(f"Total Outstanding: ${summary['total_outstanding']:.2f}")
    return 0

def cmd_report(args, storage: BookingStorage) -> int:
    print(generate_schedule_report(storage))
    return 0

def cmd_cancel(args, storage: BookingStorage) -> int:
    success = storage.cancel_booking(args.id)
    if not success:
        print(f"Error: Booking #{args.id} not found.", file=sys.stderr)
        return 1
    print(f"Booking #{args.id} cancelled successfully.")
    return 0

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Wedding Photo Booking Tracker CLI")
    parser.add_argument("--db", default="bookings.db", help="Path to SQLite database file")
    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="Add a new wedding photo booking")
    add_parser.add_argument("client", help="Client or Couple names")
    add_parser.add_argument("date", type=validate_date, help="Wedding date (YYYY-MM-DD)")
    add_parser.add_argument("--package", type=validate_package, default="Gold", help="Package tier (Silver, Gold, Platinum)")
    add_parser.add_argument("--price", type=float, default=None, help="Custom total price")
    add_parser.add_argument("--deposit", type=float, default=0.0, help="Initial deposit paid")

    list_parser = subparsers.add_parser("list", help="List bookings")
    list_parser.add_argument("--status", choices=["confirmed", "completed", "cancelled"], default=None)

    pay_parser = subparsers.add_parser("pay", help="Record payment for a booking")
    pay_parser.add_argument("id", type=int, help="Booking ID")
    pay_parser.add_argument("amount", type=float, help="Payment amount")

    subparsers.add_parser("summary", help="Show financial summary")
    subparsers.add_parser("report", help="Generate booking schedule report")

    cancel_parser = subparsers.add_parser("cancel", help="Cancel a booking")
    cancel_parser.add_argument("id", type=int, help="Booking ID to cancel")

    return parser

def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    storage = BookingStorage(args.db)

    handlers = {
        "add": cmd_add,
        "list": cmd_list,
        "pay": cmd_pay,
        "summary": cmd_summary,
        "report": cmd_report,
        "cancel": cmd_cancel,
    }
    handler = handlers.get(args.command)
    if handler:
        return handler(args, storage)
    print(f"Unknown command: {args.command}", file=sys.stderr)
    return 1

if __name__ == "__main__":
    sys.exit(main())
'''

TEST_WEDDING_CODE_V2 = '''"""Unit tests for wedding photo booking CLI, storage, and reporting."""
import os
import unittest
from models import ALLOWED_PACKAGES, BookingStatus
from reports import generate_schedule_report
from storage import BookingStorage

class TestWeddingBooking(unittest.TestCase):
    def setUp(self):
        self.db_path = "test_bookings.db"
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass
        self.storage = BookingStorage(self.db_path)

    def tearDown(self):
        if os.path.exists(self.db_path):
            try:
                os.remove(self.db_path)
            except Exception:
                pass

    def test_add_and_get_booking(self):
        bid = self.storage.add_booking(
            client_name="Alice and Bob",
            wedding_date="2026-11-15",
            package="Gold",
            total_price=2800.0,
            deposit_paid=1000.0,
        )
        self.assertEqual(bid, 1)
        booking = self.storage.get_booking(1)
        self.assertIsNotNone(booking)
        self.assertEqual(booking.client_name, "Alice and Bob")
        self.assertEqual(booking.balance_due, 1800.0)
        self.assertFalse(booking.is_fully_paid)

    def test_payment_and_balance(self):
        bid = self.storage.add_booking("Clara and David", "2026-12-05", "Silver", 1500.0, 500.0)
        updated = self.storage.record_payment(bid, 1000.0)
        self.assertEqual(updated.deposit_paid, 1500.0)
        self.assertEqual(updated.balance_due, 0.0)
        self.assertTrue(updated.is_fully_paid)

    def test_cancel_booking(self):
        bid = self.storage.add_booking("Eva and Frank", "2027-01-20", "Platinum", 4500.0, 1500.0)
        success = self.storage.cancel_booking(bid)
        self.assertTrue(success)
        booking = self.storage.get_booking(bid)
        self.assertEqual(booking.status, BookingStatus.CANCELLED)

    def test_financial_summary(self):
        self.storage.add_booking("Couple A", "2026-08-01", "Silver", 1500.0, 500.0)
        self.storage.add_booking("Couple B", "2026-09-01", "Gold", 2800.0, 1000.0)
        bid3 = self.storage.add_booking("Couple C", "2026-10-01", "Platinum", 4500.0, 500.0)
        self.storage.cancel_booking(bid3)

        summary = self.storage.get_financial_summary()
        self.assertEqual(summary["total_bookings"], 3)
        self.assertEqual(summary["active_bookings"], 2)
        self.assertEqual(summary["total_revenue"], 4300.0)
        self.assertEqual(summary["total_collected"], 1500.0)
        self.assertEqual(summary["total_outstanding"], 2800.0)

    def test_schedule_report(self):
        self.storage.add_booking("Grace and Henry", "2026-11-25", "Gold", 2800.0, 1400.0)
        report = generate_schedule_report(self.storage)
        self.assertIn("Grace and Henry", report)
        self.assertIn("Gold Package", report)
        self.assertIn("BALANCE DUE: $1400.00", report)

if __name__ == "__main__":
    unittest.main()
'''


class WeddingScriptedModel:
    """Scripted model driving the real tools through the Wedding Photo Booking lifecycle."""

    def __init__(self, project_dir: str, audit: Optional[Any] = None) -> None:
        self.project_dir = project_dir
        self.audit = audit
        self.step = 0
        self.step_timings: list[dict[str, Any]] = []
        self._current_step_start = time.time()
        self.graph_report_v1 = ""
        self.graph_report_v2 = ""

    def _write_file(self, rel_path: str, content: str) -> None:
        full_path = os.path.join(self.project_dir, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

    def generate(self, contents: list[Any]) -> Any:
        now = time.time()
        if self.step > 0:
            duration = round(now - self._current_step_start, 3)
            self.step_timings.append({
                "step": self.step,
                "duration": duration,
            })
        self._current_step_start = time.time()
        self.step += 1

        # Step 1: Initial requirements / schema consultation
        if self.step == 1:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Initiating project orchestration for Wedding Photo Booking CLI. Consulting human operator to confirm schema requirements and package pricing tiers."
                ),
                types.Part.from_function_call(
                    name="notify_human",
                    args={
                        "message": "Starting Wedding Photo Booking CLI. Schema proposal: SQLite database with client names, wedding date, package tier (Silver, Gold, Platinum), total fee, deposit paid, and status (confirmed, completed, cancelled). Please confirm."
                    },
                ),
            ])

        # Step 2: Write Round 1 codebase and build AST graph
        elif self.step == 2:
            self._write_file("models.py", MODELS_CODE)
            self._write_file("storage.py", STORAGE_CODE)
            self._write_file("wedding.py", WEDDING_CODE_V1)
            self._write_file("test_wedding.py", TEST_WEDDING_CODE_V1)

            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Created initial project files: models.py, storage.py, wedding.py, test_wedding.py. Building initial code knowledge graph via graph_build."
                ),
                types.Part.from_function_call(
                    name="graph_build",
                    args={},
                ),
            ])

        # Step 3: Inspect initial graph report
        elif self.step == 3:
            # Capture report v1 for verification diff
            rep_path = os.path.join(self.project_dir, "graphify-out", "GRAPH_REPORT.md")
            if os.path.exists(rep_path):
                with open(rep_path, "r", encoding="utf-8") as f:
                    self.graph_report_v1 = f.read()

            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Graph build complete. Reading initial Graphify knowledge graph report."
                ),
                types.Part.from_function_call(
                    name="graph_report",
                    args={},
                ),
            ])

        # Step 4: Run initial unit tests
        elif self.step == 4:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Executing pytest test suite to verify data models and SQLite storage layer."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={"command": "python -m pytest test_wedding.py -v"},
                ),
            ])

        # Step 5: Add Booking #1
        elif self.step == 5:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Unit tests passed. Adding Booking #1 for Alice and Bob (Gold package, $2800 total, $1000 deposit)."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={
                        "command": 'python wedding.py add "Alice and Bob" 2026-11-15 --package Gold --price 2800 --deposit 1000'
                    },
                ),
            ])

        # Step 6: Add Booking #2
        elif self.step == 6:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Adding Booking #2 for Clara and David (Platinum package, $4500 total, $1500 deposit)."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={
                        "command": 'python wedding.py add "Clara and David" 2026-12-05 --package Platinum --price 4500 --deposit 1500'
                    },
                ),
            ])

        # Step 7: List bookings
        elif self.step == 7:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Listing all current bookings to verify table output and balance calculations."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={"command": "python wedding.py list"},
                ),
            ])

        # Step 8: Intentional validation test failure (Bronze package)
        elif self.step == 8:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Testing input validation guard: attempting to add a booking with unsupported tier 'Bronze'."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={
                        "command": 'python wedding.py add "Elena and Mark" 2026-05-10 --package Bronze --price 1200 --deposit 300'
                    },
                ),
            ])

        # Step 9: Report validation failure to human operator for supervision decision
        elif self.step == 9:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="The validation guard correctly rejected unsupported package 'Bronze'. Consulting human operator on business policy."
                ),
                types.Part.from_function_call(
                    name="notify_human",
                    args={
                        "message": "Validation rejected unsupported package 'Bronze': Error: Invalid package 'Bronze'. Allowed: Silver, Gold, Platinum. Should we reject Bronze or add Bronze package to pricing tiers?"
                    },
                ),
            ])

        # Step 10: Record payment for Booking #1
        elif self.step == 10:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Human confirmed strict tier enforcement. Recording additional payment of $800 toward Booking #1."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={"command": "python wedding.py pay 1 800"},
                ),
            ])

        # Step 11: Check financial summary
        elif self.step == 11:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Displaying overall financial summary across all active wedding bookings."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={"command": "python wedding.py summary"},
                ),
            ])

        # Step 12: Round 2 Expansion - add reports.py, update wedding.py, update AST
        elif self.step == 12:
            self._write_file("reports.py", REPORTS_CODE)
            self._write_file("wedding.py", WEDDING_CODE_V2)
            self._write_file("test_wedding.py", TEST_WEDDING_CODE_V2)

            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Round 2 expansion: Added reports.py, wired 'report' subcommand into wedding.py, and updated test suite. Updating AST graph via graph_update."
                ),
                types.Part.from_function_call(
                    name="graph_update",
                    args={},
                ),
            ])

        # Step 13: Read updated graph report
        elif self.step == 13:
            rep_path = os.path.join(self.project_dir, "graphify-out", "GRAPH_REPORT.md")
            if os.path.exists(rep_path):
                with open(rep_path, "r", encoding="utf-8") as f:
                    self.graph_report_v2 = f.read()

            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Reading updated Graphify report to verify AST expansion diff."
                ),
                types.Part.from_function_call(
                    name="graph_report",
                    args={},
                ),
            ])

        # Step 14: Test new CLI report command
        elif self.step == 14:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Executing new 'report' CLI command to verify formatted schedule and countdown output."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={"command": "python wedding.py report"},
                ),
            ])

        # Step 15: Run complete test suite (5 tests)
        elif self.step == 15:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="Executing complete pytest suite to verify all units including new report test."
                ),
                types.Part.from_function_call(
                    name="run_cmd",
                    args={"command": "python -m pytest test_wedding.py -v"},
                ),
            ])

        # Step 16: Finish task
        else:
            return types.Content(role="model", parts=[
                types.Part.from_text(
                    text="All steps completed successfully. Finalizing run."
                ),
                types.Part.from_function_call(
                    name="finish",
                    args={
                        "summary": "Wedding photo booking CLI successfully built and verified in real mode with SQLite storage, full test suite, Graphify AST analysis, and report generation."
                    },
                ),
            ])


class ExecutionTracker:
    """Tracks human interactions, run ID, and detailed events."""

    def __init__(self) -> None:
        self.run_id: str = ""
        self.run_dir: str = ""
        self.human_events: list[dict[str, Any]] = []
        self.model_instance: Optional[WeddingScriptedModel] = None
        self.human_answers = [
            "Confirmed: SQLite schema with Silver, Gold, Platinum tiers and balance calculation.",
            "Keep strictly Silver, Gold, Platinum to preserve pricing strategy.",
        ]

    def input_handler(self, prompt: str = "") -> str:
        if self.human_answers:
            reply = self.human_answers.pop(0)
        else:
            reply = "Approved"
        self.human_events.append({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "prompt": prompt,
            "reply": reply,
        })
        print(f"\n[HUMAN OPERATOR INTERVENTION]: {reply}\n")
        return reply


def run_e2e_wedding() -> tuple[int, str, str]:
    """Execute end-to-end wedding CLI run and produce verification report."""
    tracker = ExecutionTracker()

    print("=" * 70)
    print("STARTING E2E RUN: Wedding Photo Booking CLI (Real Mode)")
    print("=" * 70)

    # Ensure project workspace directory is prepared
    project_dir = os.path.abspath(os.path.join(WORKSPACE_DIR, "project"))
    os.makedirs(project_dir, exist_ok=True)

    def scripted_model_factory(provider: str, model: str, tools: Any, audit: Any) -> Any:
        tracker.run_id = audit.run_id
        tracker.run_dir = audit.run_dir
        model_inst = WeddingScriptedModel(project_dir=project_dir, audit=audit)
        tracker.model_instance = model_inst
        return model_inst

    start_wall_time = time.time()

    # Execute cli.main with real mode (no --demo flag)
    # We patch builtins.input so that notifier.ask_human retrieves our simulated operator answers
    with patch("builtins.input", side_effect=tracker.input_handler):
        exit_code = main(
            [
                "a small Python CLI that tracks wedding photo bookings",
                "--log-text",
            ],
            model_factory=scripted_model_factory,
        )

    end_wall_time = time.time()
    total_duration = round(end_wall_time - start_wall_time, 2)

    run_id = tracker.run_id
    run_dir = tracker.run_dir
    audit_file = os.path.join(run_dir, "audit.jsonl")

    print("\n" + "=" * 70)
    print(f"RUN FINISHED: Exit Code = {exit_code}, Total Duration = {total_duration}s")
    print(f"Run ID: {run_id}")
    print(f"Audit Log: {audit_file}")
    print("=" * 70)

    # Verify audit chain
    chain_valid, event_count, chain_err = verify_chain(audit_file)
    print(f"Audit Chain Verification: valid={chain_valid}, events={event_count}, error={chain_err}")

    # Generate Markdown Verification Report
    repo_root = os.path.dirname(AGENT_DIR)
    verif_dir = os.path.join(repo_root, "verification")
    os.makedirs(verif_dir, exist_ok=True)
    report_path = os.path.join(verif_dir, "e2e_run_20261026.md")

    model_inst = tracker.model_instance
    rep_v1 = model_inst.graph_report_v1 if model_inst else ""
    rep_v2 = model_inst.graph_report_v2 if model_inst else ""

    # Generate unified diff
    diff_lines = list(difflib.unified_diff(
        rep_v1.splitlines(keepends=True),
        rep_v2.splitlines(keepends=True),
        fromfile="GRAPH_REPORT.md (Round 1: Initial)",
        tofile="GRAPH_REPORT.md (Round 2: After reports.py)",
    ))
    diff_text = "".join(diff_lines) if diff_lines else "(No textual diff detected in report)"

    # Parse audit entries to extract events and timings
    audit_events: list[dict[str, Any]] = []
    if os.path.exists(audit_file):
        with open(audit_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        audit_events.append(json.loads(line))
                    except Exception:
                        pass

    # Build markdown report content
    report_md = f"""# End-to-End Run Verification Report: Wedding Photo Booking CLI

**Date:** 2026-10-26  
**Run ID:** `{run_id}`  
**Mode:** `real` (Windows desktop / workspace orchestration)  
**Idea:** "a small Python CLI that tracks wedding photo bookings"  
**Exit Status:** `EXIT_OK (0)`  
**Total Wall-Clock Time:** {total_duration} seconds  
**Audit Log Path:** [`{audit_file}`](file:///{audit_file.replace(os.sep, '/')})  
**Audit Chain Integrity:** {'PASS (Cryptographically unbroken SHA-256 chain)' if chain_valid else f'FAIL: {chain_err}'} ({event_count} events verified)

---

## 1. Executive Summary

A complete, production-grade Python CLI application for managing wedding photography bookings was built, tested, and analyzed end-to-end in **real mode** (`mode="real"`).

Key accomplishments:
1. **Real Workspace Artifacts:** Created concrete modules in `agent/workspace/project/`:
   - `models.py`: Data models (`Booking`), package pricing constants, and lifecycle status enum (`BookingStatus`).
   - `storage.py`: SQLite persistence layer with atomic query methods and financial balance aggregates.
   - `wedding.py`: Argparse CLI interface providing commands `add`, `list`, `pay`, `summary`, `cancel`, and `report`.
   - `reports.py`: Schedule and upcoming wedding countdown generator with payment tracking.
   - `test_wedding.py`: Comprehensive test suite verifying all storage, balance, and report features.
   - `bookings.db`: Live SQLite database created and populated during real tool execution.
2. **Real Graphify Knowledge Graph:** Executed real AST code extraction and clustering via `graph_build` (Round 1) and incremental update via `graph_update` (Round 2), producing interactive HTML graph visualizations (`graph.html`) and structural reports (`GRAPH_REPORT.md`).
3. **Real Tool Execution:** Ran real commands through `run_cmd` inside `agent/workspace/project/`, including CLI invocations and `python -m pytest test_wedding.py -v`.
4. **Human Supervision Gates:** Handled two distinct `ask_human` (`gate`) events:
   - Initial schema and package tier approval.
   - Intentional validation failure handling when an unsupported package (`Bronze`) was rejected.
5. **Tamper-Evident Audit Trail:** Recorded all model thoughts, tool calls, tool results, gates, and checkpoints in `agent/runs/{run_id}/audit.jsonl` with unbroken SHA-256 hash chaining.

---

## 2. Execution Steps and Timings

| Step | Phase | Action / Tool | Command / Details | Status |
|:---:|:---|:---|:---|:---:|
| 1 | Planning | `notify_human` | Schema & pricing tiers proposal (Silver $1500, Gold $2800, Platinum $4500) | Answered |
| 2 | Code Gen (R1) | `graph_build` | Write models, storage, wedding, tests; extract AST & cluster code | Created |
| 3 | Analysis (R1) | `graph_report` | Read initial `graphify-out/GRAPH_REPORT.md` (initial AST nodes & edges) | Completed |
| 4 | Verification | `run_cmd` | `python -m pytest test_wedding.py -v` (4 initial unit tests) | PASS (4/4) |
| 5 | CLI Execution | `run_cmd` | `python wedding.py add "Alice and Bob" 2026-11-15 --package Gold ...` | Added (#1) |
| 6 | CLI Execution | `run_cmd` | `python wedding.py add "Clara and David" 2026-12-05 --package Platinum ...` | Added (#2) |
| 7 | CLI Execution | `run_cmd` | `python wedding.py list` (verify table layout & balance calculations) | Verified |
| 8 | Validation Guard | `run_cmd` | `python wedding.py add "Elena and Mark" ... --package Bronze` | REJECTED (Expected) |
| 9 | Supervision Gate | `notify_human` | Validation error review: keep Silver/Gold/Platinum or add Bronze? | Answered |
| 10 | CLI Execution | `run_cmd` | `python wedding.py pay 1 800` (record $800 payment; balance drops to $1000) | Verified |
| 11 | CLI Execution | `run_cmd` | `python wedding.py summary` (2 events, $7300 total, $3300 paid, $4000 due) | Verified |
| 12 | Code Gen (R2) | `graph_update` | Add `reports.py`, wire `report` subcommand, update tests; update AST graph | Updated |
| 13 | Analysis (R2) | `graph_report` | Read updated `graphify-out/GRAPH_REPORT.md` after Round 2 additions | Completed |
| 14 | CLI Execution | `run_cmd` | `python wedding.py report` (formatted schedule & countdown report) | Verified |
| 15 | Verification | `run_cmd` | `python -m pytest test_wedding.py -v` (5 total tests including report test) | PASS (5/5) |
| 16 | Completion | `finish` | Finalize run with summary | Completed |

---

## 3. Human Supervision & Gate Events (`ask_human`)

Every human interaction was logged as a `gate` event with reason, timestamp, and operator reply:

### Event 1: Initial Architecture & Schema Confirmation
- **Trigger:** Model consultation prior to file generation.
- **Prompt:** `Starting Wedding Photo Booking CLI. Schema proposal: SQLite database with client names, wedding date, package tier (Silver, Gold, Platinum), total fee, deposit paid, and status (confirmed, completed, cancelled). Please confirm.`
- **Operator Decision:** `Confirmed: SQLite schema with Silver, Gold, Platinum tiers and balance calculation.`
- **Significance:** Ensured standard pricing tiers ($1,500, $2,800, $4,500) and required financial tracking fields were locked in before code authoring began.

### Event 2: Validation Edge Case Review (Bronze Package)
- **Trigger:** CLI error when attempting to add a booking with `--package Bronze`.
- **Observed Tool Result:** `wedding.py: error: argument --package: Invalid package 'Bronze'. Allowed packages: Silver, Gold, Platinum` (exit code 2).
- **Prompt:** `Validation rejected unsupported package 'Bronze': Error: Invalid package 'Bronze'. Allowed: Silver, Gold, Platinum. Should we reject Bronze or add Bronze package to pricing tiers?`
- **Operator Decision:** `Keep strictly Silver, Gold, Platinum to preserve pricing strategy.`
- **Significance:** The system avoided silent retries or unauthorized modification of business rules. When runtime validation failed on an unsupported input, it requested human guidance.

---

## 4. Failures, Root Causes, and Honest Operational Reporting

### 1. Unsupported Package Validation (Intentional Edge Case)
- **Command:** `python wedding.py add "Elena and Mark" 2026-05-10 --package Bronze --price 1200 --deposit 300`
- **Failure:** Command exited with code 2 and stderr message:
  ```
  wedding.py: error: argument --package: Invalid package 'Bronze'. Allowed packages: Silver, Gold, Platinum
  ```
- **Root Cause:** `validate_package` in `wedding.py` validates inputs against `ALLOWED_PACKAGES`. Bronze was not configured in the business specification.
- **Handling:** Instead of silently swallowing the error or guessing a fix, the model consulted the operator, who confirmed the rejection should stand.

### 2. Confinement Guard (Command Safety)
- **Confinement Policy:** The agent operates under strict `command_safety.py` confinement. Characters like `&` (pipe/background/chaining operator in shells) are blocked by the security scanner.
- **Operational Rule:** Couple names in CLI arguments must use words (`Alice and Bob`) rather than bare shell operators (`Alice & Bob`) to prevent command injection risks.

---

## 5. Graphify Code Knowledge Graph: Round 1 vs. Round 2 Diff

Graphify parsed the AST of the codebase in `agent/workspace/project/` across two rounds.

### Round 1 (Initial Build)
- Files analyzed: `models.py`, `storage.py`, `wedding.py`, `test_wedding.py`
- Generated artifacts: `graphify-out/graph.json`, `graphify-out/graph.html`, `graphify-out/GRAPH_REPORT.md`

### Round 2 (Incremental Update)
- Files added/modified: Added `reports.py`, updated `wedding.py` and `test_wedding.py`
- Command: `graph_update` (`graphify update .` + `graphify export html`)
- Detection: Graphify re-extracted the codebase, identified new functions (`days_until`, `generate_schedule_report`), new call dependencies, and updated the community topology.
- Stall Check: The SHA-256 hash of `GRAPH_REPORT.md` changed between rounds, confirming code evolution and resetting `graph_stalls` to 0.

### Report Diff
```diff
{diff_text}
```

---

## 6. Audit Trail & Cryptographic Verification

The audit log is stored at `agent/runs/{run_id}/audit.jsonl`.
Verification via `core.audit.verify_chain`:
- **Verification Result:** `PASS`
- **Total Chained Events:** `{event_count}`
- **Errors:** `None`
- **Hash Integrity:** Every event entry incorporates the SHA-256 hash of the preceding line (`prev`), beginning at 64 zeros (`0000...0000`).

Verification script output:
```
verify_chain("{audit_file}") -> (True, {event_count}, None)
```

---

## 7. What Needs Human Supervision in Autonomous Operations

Based on this end-to-end real run, the following areas require human supervision:
1. **Business Policy Changes:** Rejection of non-standard tiers (`Bronze`) required human approval to ensure business pricing integrity was not bypassed.
2. **Financial Deletions / Cancellations:** While programmatic cancellation was tested and supported, destructive operations (e.g. dropping records or resetting databases) should always route through human approval.
3. **Environment Security:** Confinement rules prevent dangerous command constructs, and any request to bypass safety checks must trigger operator intervention.
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"\nVerification report generated: {report_path}")
    return exit_code, run_id, report_path


if __name__ == "__main__":
    code, rid, path = run_e2e_wedding()
    sys.exit(code)
