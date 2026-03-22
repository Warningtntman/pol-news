#!/bin/bash
# Starts backend and frontend in parallel. Ctrl-C kills both.
trap "kill 0" EXIT

(cd "$(dirname "$0")/backend" && source .venv/Scripts/activate && uvicorn main:app --reload --port 8000) &
(cd "$(dirname "$0")/frontend" && npm run dev) &

wait
