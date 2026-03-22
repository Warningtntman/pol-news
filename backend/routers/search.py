import asyncio
from collections import defaultdict
from typing import List

from fastapi import APIRouter, HTTPException, Query

import cache
from models.article import AnalyzedArticle, BiasResult
from models.api_responses import AggregateResult, SearchResponse, SourceBreakdown
from services import newsdata, bias_analyzer

router = APIRouter()


def _mean_bias(biases: List[BiasResult]) -> BiasResult:
    n = len(biases)
    return BiasResult(
        left=round(sum(b.left for b in biases) / n, 1),
        center=round(sum(b.center for b in biases) / n, 1),
        right=round(sum(b.right for b in biases) / n, 1),
    )


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/cache/stats")
async def cache_stats():
    return cache.stats()


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    description: str = Query(default="", description="Optional topic description for better bias context"),
    max_results: int = Query(default=25, ge=1, le=50),
):
    try:
        articles = await newsdata.fetch_articles(q, max_results)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"News API error: {exc}")

    if not articles:
        return SearchResponse(
            query=q,
            aggregate=AggregateResult(
                weighted_bias=BiasResult(left=0, center=100, right=0),
                total_articles=0,
            ),
            articles=[],
            sources=[],
        )

    # Analyze up to 10 articles for bias; rest get sentinel
    MAX_BIAS = 10
    to_analyze = articles[:MAX_BIAS]
    skipped = articles[MAX_BIAS:]
    analyzed_results = await asyncio.gather(
        *[bias_analyzer.analyze_article(a, description) for a in to_analyze]
    )
    _default = BiasResult(left=0, center=100, right=0)
    results = list(analyzed_results) + [(_default, None) for _ in skipped]

    analyzed: List[AnalyzedArticle] = []
    errors: List[str] = []

    for article, (bias, error) in zip(articles, results):
        if error:
            errors.append(error)
        cached = cache.get(article.url) is not None and error is None
        analyzed.append(AnalyzedArticle(article=article, bias=bias, bias_cached=cached))

    # Aggregate across all articles
    all_biases = [a.bias for a in analyzed]
    aggregate = AggregateResult(
        weighted_bias=_mean_bias(all_biases),
        total_articles=len(analyzed),
    )

    # Per-source breakdown
    source_groups: dict[str, list] = defaultdict(list)
    source_names: dict[str, str] = {}
    for a in analyzed:
        sid = a.article.source_id
        source_groups[sid].append(a.bias)
        source_names[sid] = a.article.source_name

    sources = [
        SourceBreakdown(
            source_id=sid,
            source_name=source_names[sid],
            article_count=len(biases),
            average_bias=_mean_bias(biases),
        )
        for sid, biases in source_groups.items()
    ]
    sources.sort(key=lambda s: s.article_count, reverse=True)

    return SearchResponse(
        query=q,
        aggregate=aggregate,
        articles=analyzed,
        sources=sources,
        errors=errors,
    )
