import asyncio
import json
import logging
import re
from typing import Optional

import anthropic

import cache
from config import settings
from models.article import Article, BiasResult

logger = logging.getLogger(__name__)

_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
_semaphore = asyncio.Semaphore(5)

SYSTEM_PROMPT = """You are a political media bias analyst. Analyze article content and return a JSON object estimating the political bias of the text.

Rules:
- "left": progressive, liberal, or left-leaning framing, language, or source selection.
- "center": factual, balanced, or independent/nonpartisan reporting.
- "right": conservative, right-leaning framing, language, or source selection.
- The three values MUST be non-negative integers that sum to exactly 100.
- Base your rating on word choice, framing, emphasis, omissions, and sourcing — not just topic.
- Return ONLY a JSON object with exactly these three keys: left, center, right.
- No explanation. No markdown. No extra keys. Just the JSON.

Example output: {"left": 15, "center": 70, "right": 15}"""

_SENTINEL = BiasResult(left=0, center=100, right=0)


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


async def analyze_article(article: Article) -> tuple[BiasResult, Optional[str]]:
    """Returns (BiasResult, error_message_or_None)."""
    cached = cache.get(article.url)
    if cached is not None:
        return cached, None

    content_snippet = (article.content or article.description or article.title)[:3000]
    user_message = (
        f"Analyze the political bias of the following news article.\n\n"
        f"Title: {article.title}\n\n"
        f"Content: {content_snippet}\n\n"
        f"Return your bias rating as a JSON object."
    )

    async with _semaphore:
        try:
            message = await _client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=64,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )
            result = _parse_response(message.content[0].text)
            cache.set(article.url, result)
            return result, None
        except Exception as exc:
            logger.error("Bias analysis failed for %s: %s", article.url, exc)
            return _SENTINEL, f"Analysis unavailable for '{article.title[:60]}': {exc}"
