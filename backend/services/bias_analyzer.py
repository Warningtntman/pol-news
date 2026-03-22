import asyncio
import json
import logging
import re
from typing import Optional

import httpx

import cache
from config import settings
from models.article import Article, BiasResult

logger = logging.getLogger(__name__)

_semaphore = asyncio.Semaphore(1)

_SYSTEM = """You are a political media bias analyst. Analyze article content and return a JSON object estimating the political bias of the text.

Rules:
- "left": progressive, liberal, or left-leaning framing, language, or source selection.
- "center": factual, balanced, or independent/nonpartisan reporting.
- "right": conservative, right-leaning framing, language, or source selection.
- The three values MUST be non-negative integers that sum to exactly 100.
- Base your rating on word choice, framing, emphasis, omissions, and sourcing — not just topic.
- Return ONLY a JSON object with exactly these three keys: left, center, right.
- No explanation. No markdown. No extra keys. Just the JSON.

Example output: {"left": 40, "center": 20, "right": 40}"""

_SENTINEL = BiasResult(left=0, center=100, right=0)
_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent"


def _parse_response(text: str) -> BiasResult:
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    data = json.loads(text)
    left = float(data["left"])
    center = float(data["center"])
    right = float(data["right"])
    total = left + center + right
    if total == 0:
        raise ValueError("All-zero bias returned by model")
    return BiasResult(
        left=round(left / total * 100, 1),
        center=round(center / total * 100, 1),
        right=round(right / total * 100, 1),
    )


async def analyze_article(article: Article, topic_description: str = "") -> tuple[BiasResult, Optional[str]]:
    """Returns (BiasResult, error_message_or_None)."""
    cached = cache.get(article.url)
    if cached is not None:
        return cached, None

    content_snippet = (article.content or article.description or article.title)[:3000]
    context = f"Topic context: {topic_description}\n\n" if topic_description.strip() else ""
    user_message = (
        f"Analyze the political bias of the following news article.\n\n"
        f"{context}"
        f"Title: {article.title}\n\n"
        f"Content: {content_snippet}\n\n"
        f"Return your bias rating as a JSON object."
    )

    payload = {
        "contents": [{"parts": [{"text": f"{_SYSTEM}\n\n{user_message}"}]}],
        "generationConfig": {"maxOutputTokens": 512},
    }

    async with _semaphore:
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        _GEMINI_URL,
                        params={"key": settings.gemini_api_key},
                        json=payload,
                    )
                    if resp.status_code == 429:
                        await asyncio.sleep(20 * (attempt + 1))
                        continue
                    resp.raise_for_status()
                    data = resp.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                result = _parse_response(text)
                cache.set(article.url, result)
                await asyncio.sleep(2)  # light throttle for Gemma free tier
                return result, None
            except (json.JSONDecodeError, KeyError, ValueError):
                return _SENTINEL, None  # bad model output — fail silently
            except Exception as exc:
                if attempt == 2:
                    logger.error("Bias analysis failed for %s: %s", article.url, exc)
                    return _SENTINEL, f"Analysis unavailable for '{article.title[:60]}': {exc}"
                await asyncio.sleep(5)
        return _SENTINEL, f"Analysis unavailable for '{article.title[:60]}': rate limited"
