from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import json
import trafilatura
from trafilatura.settings import use_config
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")
INSFORGE_API_KEY = os.getenv("INSFORGE_API_KEY")
NEWSDATA_URL = "https://newsdata.io/api/1/latest"

# 1. SETUP INSFORGE CLIENT
insforge_client = OpenAI(
    base_url="https://api.insforge.dev/v1", 
    api_key=INSFORGE_API_KEY
)

# 2. CONFIGURE SCRAPER TO AVOID BLOCKS
# This sets the User-Agent globally for all trafilatura fetches
scraper_config = use_config()
scraper_config.set('DEFAULT', 'USER_AGENTS', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')

@app.get("/api/news")
def get_news():
    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en",
        "country": "us",
        "category": "politics,top"
    }
    
    response = requests.get(NEWSDATA_URL, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="News API failed")
        
    articles = response.json().get('results', [])[:5] 
    
    for article in articles:
        url = article.get('link')
        print(f"Scraping: {url}")
        
        # 3. SCRAPE FULL TEXT
        scraped_text = ""
        try:
            downloaded = trafilatura.fetch_url(url, config=scraper_config)
            if downloaded:
                scraped_text = trafilatura.extract(downloaded)
        except Exception as e:
            print(f"Scrape error: {e}")

        # Combine data for AI (max 2000 chars to save credits)
        text_to_analyze = (scraped_text or article.get('description') or "")[:2000]
        
        if not text_to_analyze.strip():
            article['bias_scores'] = {"left": 0, "center": 100, "right": 0}
            continue

        try:
            # 4. CALL GROK 4.1 FAST (HACKATHON WINNER)
            ai_response = insforge_client.chat.completions.create(
                model="x-ai/grok-4-1-fast-non-reasoning", 
                messages=[
                    {"role": "system", "content": "Analyze the political bias of the text. Return ONLY raw JSON: {'left': int, 'center': int, 'right': int}. Sum to 100."},
                    {"role": "user", "content": text_to_analyze}
                ],
                response_format={ "type": "json_object" } # Grok 4.1 handles this perfectly
            )
            
            raw_content = ai_response.choices[0].message.content
            article['bias_scores'] = json.loads(raw_content)
            print(f"AI Success: {article['bias_scores']}")
            
        except Exception as e:
            print(f"AI Analysis failed: {e}")
            article['bias_scores'] = {"left": 0, "center": 100, "right": 0} 
            
    return {"status": "success", "results": articles}