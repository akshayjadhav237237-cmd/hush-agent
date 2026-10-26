"""Pytest configuration for tests_real."""
import os
import sys

# Ensure agent directory is in sys.path
agent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if agent_dir not in sys.path:
    sys.path.insert(0, agent_dir)
