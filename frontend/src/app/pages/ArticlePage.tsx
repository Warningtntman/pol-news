import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { BiasMeter } from '../components/BiasMeter';
import type { SourceArticle, StoryCluster as StoryClusterType } from '../data/mockData';
import {
  fetchNewsStoryClusters,
  getPendingSearchArticleStorageKey,
  ingestSearchArticle,
} from '../api/newsApi';

export function ArticlePage() {
  const { storyId, articleId } = useParams();
  const navigate = useNavigate();
  const [storyClusters, setStoryClusters] = useState<StoryClusterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let ingestError: string | null = null;
      try {
        setError(null);
        const isSearchOpen = storyId === 'latest' && Boolean(articleId);
        if (isSearchOpen && articleId) {
          let pending: SourceArticle | null = null;
          const storageKey = getPendingSearchArticleStorageKey(articleId);
          try {
            const raw = sessionStorage.getItem(storageKey);
            if (raw) pending = JSON.parse(raw) as SourceArticle;
            sessionStorage.removeItem(storageKey);
          } catch {
            pending = null;
          }

          if (pending) {
            try {
              await ingestSearchArticle(pending);
            } catch (e) {
              ingestError = e instanceof Error ? e.message : String(e);
            }
          }
        }

        const data = await fetchNewsStoryClusters();
        if (cancelled) return;

        setStoryClusters(data);
        if (ingestError) {
          const storyMatch = data.find((s) => s.id === storyId);
          const articleMatch = storyMatch?.sources.find((a) => a.id === articleId);
          if (!articleMatch) {
            setError(ingestError);
          }
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storyId, articleId]);

  const story = storyClusters.find((s) => s.id === storyId);
  const article = story?.sources.find((a) => a.id === articleId);

  if (loading) {
    return <div className="min-h-screen p-6 font-['Inter'] text-sm text-gray-600">Loading article...</div>;
  }

  if (error) {
    return <div className="min-h-screen p-6 text-sm text-red-700">{error}</div>;
  }

  if (!article || !story) {
    return <div className="min-h-screen p-6 font-['Inter'] text-sm text-gray-600">Article not found</div>;
  }

  const hasExternalUrl = article.url && article.url !== '#';
  const hasPerspectives =
    article.perspectives &&
    (article.perspectives.left ||
      article.perspectives.center ||
      article.perspectives.right);

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Sticky Top Nav with Bias Meter */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/feed')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {article.publisherLogo}
              </div>
              <span className="font-medium text-sm text-gray-900">
                {article.publisher}
              </span>
            </div>
          </div>
          
          <BiasMeter bias={article.bias} />
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-['Merriweather'] font-bold text-3xl text-gray-900 mb-6 leading-tight">
          {article.headline}
        </h1>

        <div className="prose prose-lg max-w-none font-['Inter'] mb-10">
          <h2 className="font-['Merriweather'] text-lg font-bold text-gray-900 not-prose mb-2">
            From the article
          </h2>
          {article.contentSummary ? (
            <p className="text-gray-700 leading-relaxed mb-4 not-prose">{article.contentSummary}</p>
          ) : (
            <p className="text-gray-500 text-sm mb-4 not-prose">
              No excerpt stored yet. Open the original link for full reporting.
            </p>
          )}
          <p className="text-gray-600 text-sm not-prose mb-4">
            The bias meter reflects the source text we analyzed. Below are hypothetical left, center, and
            right framings of the same story—not predictions of any specific outlet.
          </p>
          {hasExternalUrl ? (
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-blue-700 hover:text-blue-800 font-medium underline not-prose"
            >
              Read original article
            </a>
          ) : (
            <p className="text-gray-600 text-sm not-prose">No external link provided by the backend.</p>
          )}
        </div>

        <h2 className="font-['Merriweather'] text-xl font-bold text-gray-900 mb-4">
          Political perspectives
        </h2>
        {hasPerspectives && article.perspectives ? (
          <div className="flex flex-col gap-4">
            <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 md:p-5">
              <h3 className="font-['Merriweather'] text-sm font-bold uppercase tracking-wide text-[#2563EB] mb-3">
                Left-leaning framing
              </h3>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {article.perspectives.left}
              </p>
            </section>
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
              <h3 className="font-['Merriweather'] text-sm font-bold uppercase tracking-wide text-[#94A3B8] mb-3">
                Centrist framing
              </h3>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {article.perspectives.center}
              </p>
            </section>
            <section className="rounded-xl border border-red-200 bg-red-50/40 p-4 md:p-5">
              <h3 className="font-['Merriweather'] text-sm font-bold uppercase tracking-wide text-[#DC2626] mb-3">
                Right-leaning framing
              </h3>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                {article.perspectives.right}
              </p>
            </section>
          </div>
        ) : (
          <p className="text-gray-500 text-sm rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
            Perspective summaries are not available for this item yet. They appear after the article is
            processed by the news sync or search pipeline.
          </p>
        )}
      </main>
    </div>
  );
}