import type { AnalyzedArticle } from '../types';
import BiasBar from './BiasBar';

interface Props {
  analyzed: AnalyzedArticle;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ArticleCard({ analyzed }: Props) {
  const { article, bias, bias_cached } = analyzed;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-800 hover:text-blue-600 hover:underline leading-snug"
          >
            {article.title}
          </a>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-500">{article.source_name}</span>
            {article.published_at && (
              <>
                <span>·</span>
                <span>{formatDate(article.published_at)}</span>
              </>
            )}
            {bias_cached && (
              <>
                <span>·</span>
                <span className="text-emerald-500">cached</span>
              </>
            )}
          </div>
        </div>
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="h-16 w-24 flex-shrink-0 rounded-lg object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {article.description && (
        <p className="mb-3 text-sm text-slate-500 line-clamp-2">{article.description}</p>
      )}

      <BiasBar bias={bias} size="sm" showLabels />
    </div>
  );
}
