import httpx
import os
import json
import asyncio
import trafilatura
from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_REPO_ROOT / ".env")
load_dotenv()

# --- CONFIGURATION ---
INSFORGE_BASE_URL = os.getenv("INSFORGE_BASE_URL", "").rstrip('/')
# Use your ik_ Integration Key for full database permissions
INSFORGE_KEY = os.getenv("INSFORGE_API_KEY") 
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

HAS_INFORGE = bool(INSFORGE_BASE_URL and INSFORGE_KEY)
HAS_NEWSDATA = bool(NEWSDATA_API_KEY)

# InsForge `news` table: add text columns if upserts fail — content_summary, summary_left, summary_center, summary_right

CONTENT_EXCERPT_MAX = 550


def _coerce_int(val, default: int = 0) -> int:
    try:
        return int(float(val))
    except (TypeError, ValueError):
        return default


def make_content_excerpt(source: str, max_len: int = CONTENT_EXCERPT_MAX) -> str:
    """Neutral excerpt from scraped body or NewsData description."""
    if not source or not str(source).strip():
        return ""
    text = " ".join(str(source).split())
    if len(text) <= max_len:
        return text
    chunk = text[: max_len + 1]
    cut = max(chunk.rfind(". "), chunk.rfind("! "), chunk.rfind("? "))
    if cut >= max_len // 2:
        return chunk[: cut + 1].strip()
    sp = chunk.rfind(" ")
    return (chunk[: sp] if sp > 0 else chunk[:max_len]).strip() + "…"


def normalize_article_insights(parsed: object) -> dict:
    """Bias percentages + three perspective summaries from LLM JSON."""
    empty = {
        "left": 0,
        "center": 100,
        "right": 0,
        "left_summary": "",
        "center_summary": "",
        "right_summary": "",
    }
    if not isinstance(parsed, dict):
        return empty
    left = _coerce_int(parsed.get("left"))
    center = _coerce_int(parsed.get("center"))
    right = _coerce_int(parsed.get("right"))
    total = left + center + right
    if total == 0:
        left, center, right = 0, 100, 0
    elif total != 100:
        left = round(100 * left / total)
        center = round(100 * center / total)
        right = max(0, 100 - left - center)

    def _s(key: str) -> str:
        v = parsed.get(key)
        return str(v).strip() if v is not None else ""

    return {
        "left": left,
        "center": center,
        "right": right,
        "left_summary": _s("left_summary"),
        "center_summary": _s("center_summary"),
        "right_summary": _s("right_summary"),
    }


class InsForgeClient:
    def __init__(self) -> None:
        self.base_url = INSFORGE_BASE_URL
        self._key = INSFORGE_KEY

    @property
    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._key}',
            'Content-Type': 'application/json',
        }

    async def analyze_article_insights(self, text: str) -> dict:
        """LLM: bias split + left/center/right narrative summaries (Claude via InsForge)."""
        payload = {
            'model': 'anthropic/claude-haiku-4.5',
            'messages': [
                {
                    "role": "system",
                    "content": (
                        "You are an expert political media analyst. The user text is from a US political news article "
                        "(full excerpt or wire description).\n"
                        "1) Estimate ideological lean of the SOURCE text as integers left+center+right=100.\n"
                        "2) Write three short, distinct narratives (2-4 sentences each, max ~120 words each) as HYPOTHETICAL "
                        "framing: how a typical left-leaning outlet, a centrist wire-style outlet, and a right-leaning outlet "
                        "might summarize the same underlying facts. Stay factual; no meta-commentary.\n"
                        "Return ONLY valid JSON with exactly these keys (snake_case):\n"
                        '{"left": int, "center": int, "right": int, '
                        '"left_summary": string, "center_summary": string, "right_summary": string}'
                    ),
                },
                {"role": "user", "content": f"Article text:\n{text}"},
            ],
            'stream': False,
        }
        async with httpx.AsyncClient(timeout=120) as http:
            resp = await http.post(
                f'{self.base_url}/api/ai/chat/completion', headers=self._headers, json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            content = data.get('response') or data.get('text') or data.get('message') or ""
            clean_json = content.replace('```json', '').replace('```', '').strip()
            if not clean_json:
                raise ValueError(f"Empty response from AI. Raw data keys: {list(data.keys())}")
            raw = json.loads(clean_json)
            return normalize_article_insights(raw)

    async def clear_news(self):
        """Force wipes the table using a non-null filter"""
        async with httpx.AsyncClient(timeout=30) as http:
            # Using 'not.is.null' is more reliable than 'gt.0' for all ID types
            resp = await http.delete(
                f'{self.base_url}/api/database/records/news?article_id=not.is.null', 
                headers=self._headers
            )
            if resp.status_code in [200, 204]:
                print("Database successfully wiped.")
            else:
                print(f"Clear skipped or failed (Status {resp.status_code})")

    async def delete_by_article_id(self, article_id: str):
        """Best-effort delete for single-row refresh by article_id."""
        if not article_id:
            return
        async with httpx.AsyncClient(timeout=30) as http:
            escaped_id = str(article_id).replace("\\", "\\\\").replace('"', '\\"')
            resp = await http.delete(
                f"{self.base_url}/api/database/records/news",
                headers=self._headers,
                params={"article_id": f'eq."{escaped_id}"'},
            )
            if resp.status_code not in (200, 204):
                print(f"Single-row delete skipped/failed for {article_id} (Status {resp.status_code})")

    async def save_records(self, records: list):
        """Saves news using Upsert to handle potential duplicates gracefully"""
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                f'{self.base_url}/api/database/records/news',
                headers={
                    **self._headers, 
                    'Prefer': 'return=representation,resolution=merge-duplicates',
                    'on_conflict': 'article_id'
                },
                json=records
            )
            resp.raise_for_status()
            return resp.json()

    async def get_records(self):
        """Fetches stored news for the API endpoint"""
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.get(f'{self.base_url}/api/database/records/news?order=id.desc', headers=self._headers)
            resp.raise_for_status()
            return resp.json()

insforge = InsForgeClient()

# --- AUTOMATION LOGIC ---

async def sync_news_to_db():
    """Main task: Fetch (Filtered) -> Scrape -> AI -> Clean -> Save"""
    print("Starting Filtered News Sync (US Politics Only)...")

    if not HAS_INFORGE or not HAS_NEWSDATA:
        print("Missing env vars (INSFORGE / NEWSDATA). Skipping sync.")
        return
    
    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en", 
        "category": "politics",
        "country": "us"
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get("https://newsdata.io/api/1/latest", params=params)
        data = resp.json()
        
        # SAFETY CHECK 1: Prevent NewsData API crashes
        if data.get('status') == 'error':
            print(f"NewsData API Error: {data}")
            return
            
        results = data.get('results', [])
        raw_articles = results[:10] if isinstance(results, list) else []

    db_entries = []
    for article in raw_articles:
        raw_title = article.get('title') or 'Untitled'
        title = raw_title.lower()
        
        skip_keywords = [
            'listings', 'ratings', 'stocks', 'forecast', 'horoscope',
            'trading', 'price', 'nasdaq', 'nyse', 'dividend', 'staked',
            'crypto', 'bitcoin', 'ethereum', 'network', 'yield', 'investing',
            'market', 'inc.', 'ltd.', 'shares', 'equities', 'earnings', 
            'buy rating', 'sell rating', 'wall street'
        ]

        if any(word in title for word in skip_keywords):
            print(f"Skipping non-political item: {title[:30]}")
            continue
            
        url = article.get('link')
        
        scraped_text = ""
        try:
            downloaded = trafilatura.fetch_url(url)
            scraped_text = trafilatura.extract(downloaded) or ""
        except: pass

        description = article.get('description') or ''
        text = (scraped_text if len(scraped_text) > 100 else description)[:2000]
        content_summary = make_content_excerpt(
            scraped_text if len(scraped_text) > 80 else description
        )

        insights = {
            "left": 0,
            "center": 100,
            "right": 0,
            "left_summary": "",
            "center_summary": "",
            "right_summary": "",
        }
        if len(text.strip()) > 20:
            try:
                insights = await insforge.analyze_article_insights(text)
                print(f"Bias analyzed for: {title[:40]}...")
            except Exception as e:
                print(f"AI Error for {title}: {e}")

        article_id = article.get("article_id") or article.get("link") or raw_title
        db_entries.append({
            "article_id": article_id,
            "title": raw_title,
            "link": url,
            "image": article.get("image_url"),
            "source": article.get("source_name"),
            "date": article.get("pubDate"),
            "bias_left": insights["left"],
            "bias_center": insights["center"],
            "bias_right": insights["right"],
            "content_summary": content_summary,
            "summary_left": insights["left_summary"],
            "summary_center": insights["center_summary"],
            "summary_right": insights["right_summary"],
        })

    try:
        if db_entries:
            await insforge.clear_news()
            await insforge.save_records(db_entries)
            print(f"Saved {len(db_entries)} fresh articles to database.")
    except Exception as e:
        print(f"Database Sync Failed: {e}")

async def news_worker():
    """Background loop: Immediate run, then 12-hour cycle"""
    while True:
        try:
            await sync_news_to_db()
        except Exception as e:
            print(f"Worker Error: {e}")
        await asyncio.sleep(43200) # 12 hours

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Starts the background worker as soon as the server launches
    asyncio.create_task(news_worker())
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/news")
async def get_news():
    """Returns news from the DB instantly for the UI"""
    try:
        if not HAS_INFORGE:
            return {
                "status": "success",
                "articles": [],
                "warning": "INSFORGE env vars not configured yet",
            }

        articles = await insforge.get_records()
        return {"status": "success", "articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/search")
async def search_live_news(q: str = Query(..., description="Search keyword")):
    """Fast live search: return candidates only (no per-result AI yet)."""
    if not HAS_NEWSDATA:
        raise HTTPException(status_code=500, detail="Missing NEWSDATA API key")

    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en",
        "category": "politics",
        "country": "us",
        "qInTitle": q,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get("https://newsdata.io/api/1/latest", params=params)
        data = resp.json()

    if data.get('status') == 'error':
        return {"status": "error", "message": "NewsData API Error", "articles": []}

    results = data.get('results', [])
    raw_articles = results[:6] if isinstance(results, list) else []

    live_results = []
    for article in raw_articles:
        raw_title = article.get('title') or 'Untitled'
        title = raw_title.lower()
        skip_keywords = [
            'listings', 'ratings', 'stocks', 'forecast', 'horoscope',
            'trading', 'price', 'nasdaq', 'nyse', 'dividend', 'staked',
            'crypto', 'bitcoin', 'ethereum', 'network', 'yield', 'investing',
            'market', 'inc.', 'ltd.', 'shares', 'equities', 'earnings'
        ]
        if any(word in title for word in skip_keywords):
            continue

        url = article.get('link')
        description = article.get('description') or raw_title

        live_results.append({
            "article_id": article.get("article_id") or url or raw_title,
            "title": raw_title,
            "link": url,
            "image": article.get("image_url"),
            "source": article.get("source_name"),
            "date": article.get("pubDate"),
            "description": description,
            "bias_left": 0,
            "bias_center": 0,
            "bias_right": 0,
            "content_summary": make_content_excerpt(description),
            "summary_left": "",
            "summary_center": "",
            "summary_right": "",
        })

    return {"status": "success", "articles": live_results}


@app.post("/api/article/ingest")
async def ingest_single_article(payload: dict = Body(...)):
    """On-demand ingest for a clicked search result."""
    if not HAS_INFORGE:
        raise HTTPException(status_code=500, detail="Missing INSFORGE env vars")

    raw_title = payload.get("title") or payload.get("headline") or "Untitled"
    url = payload.get("link") or payload.get("url")
    description = payload.get("description") or payload.get("content_summary") or raw_title

    scraped_text = ""
    if url:
        try:
            downloaded = trafilatura.fetch_url(url)
            scraped_text = trafilatura.extract(downloaded) or ""
        except Exception:
            pass

    text = (scraped_text if len(scraped_text) > 100 else description)[:2000]
    content_summary = make_content_excerpt(scraped_text if len(scraped_text) > 80 else description)

    insights = {
        "left": 0,
        "center": 100,
        "right": 0,
        "left_summary": "",
        "center_summary": "",
        "right_summary": "",
    }
    if len(text.strip()) > 20:
        try:
            insights = await insforge.analyze_article_insights(text)
        except Exception as e:
            print(f"Ingest AI error for {raw_title[:40]}: {e}")

    article_id = payload.get("article_id") or url or raw_title
    row = {
        "article_id": article_id,
        "title": raw_title,
        "link": url,
        "image": payload.get("image") or payload.get("image_url"),
        "source": payload.get("source") or payload.get("source_name"),
        "date": payload.get("date") or payload.get("pubDate"),
        "bias_left": insights["left"],
        "bias_center": insights["center"],
        "bias_right": insights["right"],
        "content_summary": content_summary,
        "summary_left": insights["left_summary"],
        "summary_center": insights["center_summary"],
        "summary_right": insights["right_summary"],
    }

    try:
        # Idempotent ingest: replace prior row for this article_id then insert fresh analysis.
        await insforge.delete_by_article_id(article_id)
        await insforge.save_records([row])
        return {"status": "success", "article": row}
    except httpx.HTTPStatusError as e:
        if e.response is not None and e.response.status_code == 409:
            # Treat duplicate writes as idempotent success so click flow can continue.
            return {"status": "success", "article": row}
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest article '{raw_title[:80]}': {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest article '{raw_title[:80]}': {e}",
        )