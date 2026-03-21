export interface BiasResult {
  left: number;    // 0-100
  center: number;
  right: number;
}

export interface Article {
  article_id: string;
  title: string;
  description: string | null;
  url: string;
  source_id: string;
  source_name: string;
  published_at: string | null;
  image_url: string | null;
}

export interface AnalyzedArticle {
  article: Article;
  bias: BiasResult;
  bias_cached: boolean;
}

export interface SourceBreakdown {
  source_id: string;
  source_name: string;
  article_count: number;
  average_bias: BiasResult;
}

export interface AggregateResult {
  weighted_bias: BiasResult;
  total_articles: number;
}

export interface SearchResponse {
  query: string;
  aggregate: AggregateResult;
  articles: AnalyzedArticle[];
  sources: SourceBreakdown[];
  errors: string[];
}
