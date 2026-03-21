import type { AnalyzedArticle } from '../types';
import ArticleCard from './ArticleCard';

interface Props {
  articles: AnalyzedArticle[];
}

export default function ArticleList({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <p className="py-8 text-center text-slate-400">No articles found for this query.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-slate-700">
        Articles <span className="text-sm font-normal text-slate-400">({articles.length})</span>
      </h3>
      {articles.map((a) => (
        <ArticleCard key={a.article.article_id} analyzed={a} />
      ))}
    </div>
  );
}
