import httpx
import os
import json
import asyncio
import trafilatura
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

# --- CONFIGURATION ---
INSFORGE_BASE_URL = os.getenv("INSFORGE_BASE_URL", "").rstrip('/')
# Use your ik_ Integration Key for full database permissions
INSFORGE_KEY = os.getenv("INSFORGE_API_KEY") 
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

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
        """Calls Grok 4.1 via InsForge Gateway"""
        payload = {
            'model': 'x-ai/grok-4.1-fast',
            'messages': [
                {"role": "system", "content": "Return ONLY JSON: {'left': int, 'center': int, 'right': int}. Sum to 100."},
                {"role": "user", "content": text}
            ],
            'stream': False
        }
        async with httpx.AsyncClient(timeout=60) as http:
            resp = await http.post(f'{self.base_url}/api/ai/chat/completion', headers=self._headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data.get('text') or data.get('message') or ""
            clean_json = content.replace('```json', '').replace('```', '').strip()
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
                print("🧹 Database successfully wiped.")
            else:
                print(f"⚠️ Clear skipped or failed (Status {resp.status_code})")

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
    print("🔄 Starting Filtered News Sync (US Politics Only)...")
    
    # Updated params for strict filtering
    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en", 
        "category": "politics", # Only political news
        "country": "us"         # Only US-based sources
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Latest endpoint ensures you get the most recent breaking news
        resp = await client.get("https://newsdata.io/api/1/latest", params=params)
        raw_articles = resp.json().get('results', [])[:10]
    
    # ... rest of your scraping and AI logic remains the same ...

    db_entries = []
    for article in raw_articles:
        # Add this inside your 'for article in raw_articles:' loop
        title = article.get('title', '').lower()
        skip_keywords = ['listings', 'ratings', 'stocks', 'forecast', 'horoscope']

        if any(word in title for word in skip_keywords):
            print(f"⏩ Skipping non-political item: {title[:30]}")
            continue
        url = article.get('link')
        title = article.get('title', 'Untitled')
        
        # Scrape Text
        scraped_text = ""
        try:
            downloaded = trafilatura.fetch_url(url)
            scraped_text = trafilatura.extract(downloaded) if downloaded else ""
        except: pass

        text = (scraped_text if len(scraped_text) > 100 else article.get('description', ''))[:2000]
        
        # AI Analysis
        bias = {"left": 0, "center": 100, "right": 0}
        if len(text.strip()) > 20:
            try:
                bias = await insforge.analyze_bias(text)
                print(f"📊 Bias analyzed for: {title[:40]}...")
            except Exception as e:
                print(f"AI Error for {title}: {e}")

        db_entries.append({
            "article_id": article.get("article_id"),
            "title": title,
            "link": url,
            "image": article.get("image_url"),
            "source": article.get("source_name"),
            "date": article.get("pubDate"),
            "bias_left": bias['left'],
            "bias_center": bias['center'],
            "bias_right": bias['right']
        })

    # Execute Database Sync
    try:
        # We clear first to ensure we only have the freshest 10 articles
        await insforge.clear_news()
        await insforge.save_records(db_entries)
        print(f"✅ Saved {len(db_entries)} fresh articles to database.")
    except Exception as e:
        print(f"❌ Database Sync Failed: {e}")

async def news_worker():
    """Background loop: Immediate run, then 12-hour cycle"""
    while True:
        try:
            await sync_news_to_db()
        except Exception as e:
            print(f"❌ Worker Error: {e}")
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
        articles = await insforge.get_records()
        return {"status": "success", "articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))