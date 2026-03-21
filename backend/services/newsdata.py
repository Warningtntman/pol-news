from typing import List

import httpx

from config import settings
from models.article import Article

BASE_URL = "https://newsdata.io/api/1/news"


def _parse_article(raw: dict) -> Article:
    return Article(
        article_id=raw.get("article_id") or raw.get("id", ""),
        title=raw.get("title") or "",
        description=raw.get("description"),
        content=raw.get("full_content") or raw.get("content"),
        url=raw.get("link") or "",
        source_id=raw.get("source_id") or "",
        source_name=raw.get("source_name") or raw.get("source_id") or "",
        published_at=raw.get("pubDate"),
        image_url=raw.get("image_url"),
    )


async def fetch_articles(query: str, max_results: int = 10) -> List[Article]:
    params = {
        "apikey": settings.newsdata_api_key,
        "q": query,
        "language": "en",
        "full_content": 1,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    if data.get("status") != "success":
        raise ValueError(f"newsdata.io error: {data.get('message', 'unknown error')}")

    raw_articles = data.get("results", [])[:max_results]
    return [_parse_article(r) for r in raw_articles]
