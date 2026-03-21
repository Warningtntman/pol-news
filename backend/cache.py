from typing import Dict, Optional

from models.article import BiasResult

_cache: Dict[str, BiasResult] = {}  # key = article URL


def get(url: str) -> Optional[BiasResult]:
    return _cache.get(url)


def set(url: str, result: BiasResult) -> None:
    _cache[url] = result


def stats() -> dict:
    return {"cached_articles": len(_cache)}
