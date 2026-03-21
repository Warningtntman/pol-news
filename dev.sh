#!/bin/bash
# Starts backend and frontend in parallel. Ctrl-C kills both.
trap "kill 0" EXIT

(cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000) &
(cd frontend && npm run dev) &

wait
