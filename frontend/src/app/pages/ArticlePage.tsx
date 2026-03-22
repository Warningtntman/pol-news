import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { BiasMeter } from '../components/BiasMeter';
import type { StoryCluster as StoryClusterType } from '../data/mockData';
import { fetchNewsStoryClusters } from '../api/newsApi';

export function ArticlePage() {
  const { storyId, articleId } = useParams();
  const navigate = useNavigate();
  const [storyClusters, setStoryClusters] = useState<StoryClusterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchNewsStoryClusters();
        if (!cancelled) setStoryClusters(data);
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
  }, []);

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

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Sticky Top Nav with Bias Meter */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-['Merriweather'] font-bold text-3xl text-gray-900 mb-6 leading-tight">
          {article.headline}
        </h1>

        <div className="prose prose-lg max-w-none font-['Inter']">
          <p className="text-gray-700 leading-relaxed mb-6">
            Source bias is calculated from the article content. Read the original article below:
          </p>

          {hasExternalUrl ? (
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-blue-700 hover:text-blue-800 font-medium mb-8 underline"
            >
              {article.url}
            </a>
          ) : (
            <p className="text-gray-600 text-sm mb-8">No external link provided by the backend.</p>
          )}
        </div>
      </main>
    </div>
  );
}