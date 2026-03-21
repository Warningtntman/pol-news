import httpx
import os
import json
import trafilatura
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
INSFORGE_BASE_URL = os.getenv("INSFORGE_BASE_URL")
INSFORGE_ANON_KEY = os.getenv("INSFORGE_ANON_KEY")
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

class InsForgeClient:
    def __init__(self) -> None:
        self.base_url = INSFORGE_BASE_URL.rstrip('/')
        self._anon_key = INSFORGE_ANON_KEY

    @property
    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._anon_key}',
            'Content-Type': 'application/json',
        }

    async def analyze_bias(self, text):
        """Uses InsForge AI Gateway to get political bias scores"""
        payload = {
            'model': 'x-ai/grok-4.1-fast',
            'messages': [
                {"role": "system", "content": "Analyze bias. Return ONLY JSON: {'left': int, 'center': int, 'right': int}. Sum to 100."},
                {"role": "user", "content": text}
            ],
            'stream': False
        }
        async with httpx.AsyncClient(timeout=60) as http:
            resp = await http.post(
                f'{self.base_url}/api/ai/chat/completion',
                headers=self._headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()

            # Fix for InsForge returning content in the 'text' key
            content = data.get('text') or data.get('message') or ""
            
            # Clean up potential markdown formatting
            clean_json = content.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_json)

insforge = InsForgeClient()

@app.get("/api/news")
async def get_news():
    # 1. Fetch raw news from NewsData
    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en",
        "category": "politics",
        "country": "us"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            news_resp = await client.get("https://newsdata.io/api/1/latest", params=params)
            news_resp.raise_for_status()
            raw_articles = news_resp.json().get('results', [])[:5]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"News API Error: {e}")

    final_results = []

    for article in raw_articles:
        # --- SCRAPING LOGIC ---
        url = article.get('link')
        scraped_text = ""
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                scraped_text = trafilatura.extract(downloaded) or ""
        except:
            pass # Silently fail and use description

        # Fallback to description if scrape fails or is empty
        text_to_analyze = (scraped_text if len(scraped_text) > 100 else article.get('description') or "")[:2000]

        # --- AI BIAS ANALYSIS ---
        bias_scores = {"left": 0, "center": 100, "right": 0} # Default
        if len(text_to_analyze.strip()) > 20:
            try:
                bias_scores = await insforge.analyze_bias(text_to_analyze)
            except Exception as e:
                print(f"AI Analysis failed for {url}: {e}")

        # --- CLEANUP: ONLY KEEP RELEVANT DATA ---
        # This removes all the "ONLY AVAILABLE IN PAID PLANS" noise
        clean_article = {
            "id": article.get("article_id"),
            "title": article.get("title"),
            "link": url,
            "image": article.get("image_url"),
            "source": article.get("source_name"),
            "date": article.get("pubDate"),
            "description": article.get("description"),
            "bias": bias_scores  # Your custom AI work!
        }
        final_results.append(clean_article)

    return {"status": "success", "articles": final_results}