"""Pytest configuration and sys.path setup."""
import os
import sys

# Ensure agent/ root is on sys.path so `import core...` works universally.
AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if AGENT_DIR not in sys.path:
    sys.path.insert(0, AGENT_DIR)
