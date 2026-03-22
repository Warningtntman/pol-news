# Pol-News

Political news feed with bias scoring (InsForge) and optional live NewsData.io keyword search.

## Run locally

### Backend (FastAPI)

From the repo root (so `.env` is found):

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://127.0.0.1:8000` by default (set `VITE_BACKEND_URL` in `frontend/.env` if your API runs elsewhere).

## Environment

Create `.env` at the **repo root** with at least:

- `NEWSDATA_API_KEY` — NewsData.io API key for the background worker (US politics feed) and for `GET /api/search` (live `qInTitle` search).
- `INSFORGE_BASE_URL`, `INSFORGE_API_KEY` — InsForge DB for `/api/news` and Grok bias scoring on feed + search results.

The background worker starts with the app, runs sync once, then every 12 hours. Each successful sync replaces stored articles (`clear_news` then `save_records`).

## Verify live search

With the backend running:

```bash
curl.exe -s "http://127.0.0.1:8000/api/search?q=election"
```

On Windows PowerShell, use `curl.exe` (or `Invoke-RestMethod`) — `curl` alone is an alias for `Invoke-WebRequest`.

Expect JSON with `status` and `articles` (each with `bias_left` / `bias_center` / `bias_right` after InsForge analysis on the article description). Search does not write to the database. HTTP 200 with `status: "error"` means NewsData returned an error shape (the frontend treats that as a failed search). In the browser, use DevTools **Network** → `GET /api/search?q=...`.
