"""FastAPI entrypoint for running the backend locally.

Run (from repo root):
  python -m uvicorn main:app --reload --port 8000
"""

from api.news import app

__all__ = ["app"]