from typing import List
from pydantic import BaseModel

from models.article import AnalyzedArticle, BiasResult


class SourceBreakdown(BaseModel):
    source_id: str
    source_name: str
    article_count: int
    average_bias: BiasResult


class AggregateResult(BaseModel):
    weighted_bias: BiasResult
    total_articles: int


class SearchResponse(BaseModel):
    query: str
    aggregate: AggregateResult
    articles: List[AnalyzedArticle]
    sources: List[SourceBreakdown]
    errors: List[str] = []  # partial Claude failures, not fatal
