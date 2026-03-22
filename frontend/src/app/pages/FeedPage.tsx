import { useCallback, useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { StoryCluster } from '../components/StoryCluster';
import { NewsSearchBar } from '../components/NewsSearchBar';
import { SearchArticleCard } from '../components/SearchArticleCard';
import type { SourceArticle, StoryCluster as StoryClusterType } from '../data/mockData';
import { fetchNewsStoryClusters, type SearchNewsMeta } from '../api/newsApi';
import { Link } from 'react-router';

export function FeedPage() {
  const [storyClusters, setStoryClusters] = useState<StoryClusterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SourceArticle[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchApiWarning, setSearchApiWarning] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<SearchNewsMeta | null>(null);

  const onSearchResults = useCallback((items: SourceArticle[]) => {
    setSearchResults(items);
  }, []);
  const onSearchLoading = useCallback((v: boolean) => {
    setSearchLoading(v);
  }, []);
  const onSearchError = useCallback((msg: string | null) => {
    setSearchError(msg);
  }, []);
  const onSearchWarning = useCallback((msg: string | null) => {
    setSearchApiWarning(msg);
  }, []);
  const onSearchMeta = useCallback((meta: SearchNewsMeta | null) => {
    setSearchMeta(meta);
  }, []);
  const onSearchQueryChange = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchNewsStoryClusters();
        if (!cancelled) {
          setStoryClusters(data);
          setLastSyncedAt(new Date());
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
  }, []);

  const updatedText =
    lastSyncedAt != null
      ? `Bias Engine updated ${lastSyncedAt.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`
      : 'Bias Engine syncing...';

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Inter']">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center">
          <Link to="/">
            <h1 className="font-['Merriweather'] font-bold text-2xl text-gray-900 hover:text-blue-600 transition-colors">
              Pol-News
            </h1>
          </Link>
        </div>
      </header>

      {/* Live Sync Banner */}
      <div className="bg-[#FEF3C7] border-b border-yellow-300">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Zap className="w-4 h-4 text-yellow-700" />
            <span className="text-sm text-yellow-900 font-medium">
              Live Sync: {updatedText}
            </span>
          </div>
          <NewsSearchBar
            onResults={onSearchResults}
            onLoading={onSearchLoading}
            onError={onSearchError}
            onWarning={onSearchWarning}
            onMeta={onSearchMeta}
            onQueryChange={onSearchQueryChange}
          />
        </div>
      </div>

      {/* Story Clusters Feed */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {searchQuery.trim().length >= 2 && (
          <section className="mb-8" aria-live="polite">
            <h2 className="mb-4 font-['Merriweather'] font-bold text-2xl text-gray-900">
              Search results
            </h2>
            {searchLoading && (
              <p className="mb-4 text-sm text-gray-600">Searching…</p>
            )}
            {searchError && !searchLoading && (
              <p className="mb-4 text-sm text-red-700">{searchError}</p>
            )}
            {searchApiWarning && !searchLoading && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {searchApiWarning}
              </p>
            )}
            {!searchLoading && !searchError && searchResults.length === 0 && !searchApiWarning && (
              <p className="mb-4 text-sm text-gray-600">
                {searchMeta != null && searchMeta.totalResults === 0
                  ? 'No matches from NewsData in the current time window for that keyword.'
                  : 'No articles found for that query.'}
              </p>
            )}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((source) => (
                  <SearchArticleCard key={source.id} source={source} />
                ))}
              </div>
            )}
          </section>
        )}

        {loading ? (
          <div className="text-sm text-gray-600">Loading news...</div>
        ) : error ? (
          <div className="text-sm text-red-700">{error}</div>
        ) : storyClusters.length === 0 || storyClusters[0].sources.length === 0 ? (
          <div className="text-sm text-gray-600">No news available yet.</div>
        ) : (
          storyClusters.map((cluster) => (
            <StoryCluster key={cluster.id} cluster={cluster} />
          ))
        )}
      </main>
    </div>
  );
}
