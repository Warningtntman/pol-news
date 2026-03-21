from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safely grab the key from the environment
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")
NEWSDATA_URL = "https://newsdata.io/api/1/news"

# Check to make sure the key actually loaded
if not NEWSDATA_API_KEY:
    raise ValueError("No API key found. Please check your .env file.")

@app.get("/api/news")
def get_news():
    params = {
        "apikey": NEWSDATA_API_KEY,
        "language": "en",
        "country": "us"
    }
    
    response = requests.get(NEWSDATA_URL, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch news from API")