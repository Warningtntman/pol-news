from typing import Optional
from pydantic import BaseModel


class BiasResult(BaseModel):
    left: float    # 0-100, normalized to sum=100
    center: float
    right: float


class Article(BaseModel):
    article_id: str
    title: str
    description: Optional[str] = None
    content: Optional[str] = None  # full text for Claude analysis
    url: str
    source_id: str
    source_name: str
    published_at: Optional[str] = None
    image_url: Optional[str] = None


class AnalyzedArticle(BaseModel):
    article: Article
    bias: BiasResult
    bias_cached: bool = False
