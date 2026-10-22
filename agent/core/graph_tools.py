"""Graphify code knowledge graph tools."""
from __future__ import annotations

import hashlib
import os
import subprocess
from typing import Any, Callable, Optional

from core.types import ToolFunc

GRAPHIFY_INSTALL_HELP = "graphify is not installed. Install with: uv tool install graphifyy"
MAX_REPORT_CHARS = 6000


class GraphTools:
    """Tools for interacting with Graphify code knowledge graphs."""

    def __init__(
        self,
        project_dir: str,
        run: Callable[..., Any] = subprocess.run,
        notifier: Optional[Any] = None,
        audit: Optional[Any] = None,
        state: Optional[Any] = None,
    ) -> None:
        """Initialize GraphTools with project directory and optional dependencies."""
        self.project_dir = project_dir
        self.run = run
        self.notifier = notifier
        self.audit = audit
        self.state = state

    def _graphify(self, *args: str, timeout: int = 300) -> str:
        """Run the Graphify CLI with given arguments."""
        try:
            r = self.run(
                ["graphify", *args],
                cwd=self.project_dir,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            stdout = getattr(r, "stdout", "") or ""
            stderr = getattr(r, "stderr", "") or ""
            return (stdout + stderr)[-3000:].strip() or "(no output)"
        except FileNotFoundError:
            return GRAPHIFY_INSTALL_HELP
        except subprocess.TimeoutExpired:
            return "graphify timed out."

    def _report_path(self) -> str:
        """Return path to GRAPH_REPORT.md."""
        return os.path.join(self.project_dir, "graphify-out", "GRAPH_REPORT.md")

    def graph_build(self) -> str:
        """Build the code graph of the project directory."""
        out = [
            self._graphify("extract", ".", "--code-only"),
            self._graphify("cluster-only", ".", "--no-label"),
            self._graphify("export", "html"),
        ]
        return (
            "\n".join(out)
            + "\nGraph HTML: "
            + os.path.join(self.project_dir, "graphify-out", "graph.html")
        )

    def graph_update(self) -> str:
        """Refresh the code graph and detect stalls across build rounds."""
        out = self._graphify("update", ".") + "\n" + self._graphify("export", "html")
        report_file = self._report_path()
        try:
            with open(report_file, "rb") as f:
                h = hashlib.sha256(f.read()).hexdigest()
            if self.state:
                if h == self.state.graph_last_hash:
                    self.state.graph_stalls += 1
                else:
                    self.state.graph_stalls = 0
                self.state.graph_last_hash = h
                if self.state.graph_stalls >= 2:
                    alert_msg = (
                        "The code graph has not changed for 2 rounds in a row. "
                        "The build may be stuck."
                    )
                    if self.notifier:
                        reply = self.notifier.ask_human(alert_msg)
                        out += f"\n[!] ATTENTION: {alert_msg}\n{reply}"
                    else:
                        out += f"\n[!] ATTENTION: {alert_msg}"
        except FileNotFoundError:
            out += "\n(no GRAPH_REPORT.md found; run graph_build first)"
        return out

    def graph_report(self) -> str:
        """Read the Graphify report for the project."""
        try:
            with open(self._report_path(), encoding="utf-8") as f:
                return f.read()[:MAX_REPORT_CHARS]
        except FileNotFoundError:
            return "No report yet. Call graph_build first."

    def graph_query(self, question: str) -> str:
        """Query the code graph with a question."""
        return self._graphify("query", question)

    def graph_explain(self, symbol: str) -> str:
        """Explain a symbol using the code graph."""
        return self._graphify("explain", symbol)

    def graph_path(self, source: str, target: str) -> str:
        """Find the connection path between two symbols in the code graph."""
        return self._graphify("path", source, target)

    def funcs(self) -> dict[str, ToolFunc]:
        """Return dictionary mapping tool names to callable tool functions."""
        return {
            "graph_build": self.graph_build,
            "graph_update": self.graph_update,
            "graph_report": self.graph_report,
            "graph_query": self.graph_query,
            "graph_explain": self.graph_explain,
            "graph_path": self.graph_path,
        }
