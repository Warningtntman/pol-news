import httpx
import os
import json
import asyncio
import trafilatura
from fastapi import FastAPI, HTTPException, Query
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

    async def analyze_bias(self, text: str):
        """Calls Claude Sonnet 4.6 via InsForge Gateway"""
        payload = {
            'model': 'anthropic/claude-sonnet-4.6',
            'messages': [
                {
                    "role": "system", 
                    "content": (
                        "You are an expert political media analyst. Analyze the provided text, which is a US political news article. "
                        "Evaluate the text for: 1. Loaded language or emotional adjectives. 2. Selective omission of opposing viewpoints. "
                        "3. Policy framing (e.g., social safety nets vs. fiscal responsibility). "
                        "Return ONLY a JSON object with integer percentages representing the bias: "
                        "{'left': int, 'center': int, 'right': int}. The values MUST sum to exactly 100."
                    )
                },
                {"role": "user", "content": f"Analyze the following political text: {text}"}
            ],
            'stream': False
        }
        async with httpx.AsyncClient(timeout=60) as http:
            resp = await http.post(f'{self.base_url}/api/ai/chat/completion', headers=self._headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get('response') or data.get('text') or data.get('message') or ""
            clean_json = content.replace('```json', '').replace('```', '').strip()
            if not clean_json:
                raise ValueError(f"Empty response from AI. Raw data keys: {list(data.keys())}")
            return json.loads(clean_json)

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
        
        bias = {"left": 0, "center": 100, "right": 0}
        if len(text.strip()) > 20:
            try:
                # SAFETY CHECK 2: Only overwrite bias if it's a valid dictionary
                result = await insforge.analyze_bias(text)
                if isinstance(result, dict) and 'left' in result:
                    bias = result
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
            # SAFETY CHECK 3: Use .get() to safely grab the numbers
            "bias_left": bias.get('left', 0),
            "bias_center": bias.get('center', 100),
            "bias_right": bias.get('right', 0)
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
    """Lightning-fast live search that skips web scraping and uses summaries."""
    if not HAS_INFORGE or not HAS_NEWSDATA:
        raise HTTPException(status_code=500, detail="Missing API keys")
        
    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en", 
        "category": "politics",
        "country": "us",
        "qInTitle": q 
    }
    
    # 1. Fetch from NewsData (Fast)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get("https://newsdata.io/api/1/latest", params=params)
        data = resp.json()
        
        if data.get('status') == 'error':
            return {"status": "error", "message": "NewsData API Error", "articles": []}
            
        results = data.get('results', [])
        raw_articles = results[:6] if isinstance(results, list) else []
        
    sem = asyncio.Semaphore(4) # Allow 4 concurrent AI calls

    # 2. Process concurrently
    async def process_single_article(article):
        async with sem:
            raw_title = article.get('title') or 'Untitled'
            title = raw_title.lower()
            
            # Spam filter
            skip_keywords = [
                'listings', 'ratings', 'stocks', 'forecast', 'horoscope',
                'trading', 'price', 'nasdaq', 'nyse', 'dividend', 'staked',
                'crypto', 'bitcoin', 'ethereum', 'network', 'yield', 'investing',
                'market', 'inc.', 'ltd.', 'shares', 'equities', 'earnings'
            ]
            if any(word in title for word in skip_keywords):
                return None
                
            url = article.get('link')
            
            # ⚡ THE SPEED UP: Completely bypass Trafilatura and use the provided description
            description = article.get('description') or raw_title
            text = description[:2000] 
            
            # 3. Fast AI Analysis
            bias = {"left": 0, "center": 100, "right": 0}
            if len(text.strip()) > 15:
                try:
                    result = await insforge.analyze_bias(text)
                    if isinstance(result, dict) and 'left' in result:
                        bias = result
                except Exception as e:
                    print(f"Search AI error: {e}")
                    
            return {
                "article_id": article.get("article_id") or url or raw_title,
                "title": raw_title,
                "link": url,
                "image": article.get("image_url"),
                "source": article.get("source_name"),
                "date": article.get("pubDate"),
                "bias_left": bias.get('left', 0),
                "bias_center": bias.get('center', 100),
                "bias_right": bias.get('right', 0)
            }

    # Execute all 6 processing tasks simultaneously
    tasks = [process_single_article(article) for article in raw_articles]
    processed_results = await asyncio.gather(*tasks)
    
    live_results = [res for res in processed_results if res is not None]
        
    return {"status": "success", "articles": live_results}