import { useEffect, useMemo, useState } from 'react';
import { Zap, Search, X, Loader2 } from 'lucide-react';
import { StoryCluster } from '../components/StoryCluster';
import type { StoryCluster as StoryClusterType } from '../data/mockData';
import { assignUniqueFallbackSlots } from '../data/fallbackArticleImages';
import { fetchNewsStoryClusters, searchNewsStoryClusters } from '../api/newsApi';
import { Link } from 'react-router';

export function FeedPage() {
  const [storyClusters, setStoryClusters] = useState<StoryClusterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setIsSearching(false);
    setSearchQuery('');
    setError(null);
    try {
      const data = await fetchNewsStoryClusters();
      setStoryClusters(data);
      setLastSyncedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

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
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return loadData();
    
    setLoading(true);
    setIsSearching(true);
    setError(null);
    try {
      const data = await searchNewsStoryClusters(searchQuery);
      setStoryClusters(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const updatedText = isSearching 
    ? 'Live Search Analysis Active' 
    : (lastSyncedAt != null
      ? `Bias Engine updated ${lastSyncedAt.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`
      : 'Bias Engine syncing...');

  const fallbackSlotByKey = useMemo(
    () => assignUniqueFallbackSlots(storyClusters),
    [storyClusters],
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Inter']">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" onClick={loadData}>
            <h1 className="font-['Merriweather'] font-bold text-2xl text-gray-900 hover:text-blue-600 transition-colors">
              Pol-News
            </h1>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-grow max-w-md relative flex items-center w-full">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g. economy, climate)..." 
              className="w-full pl-10 pr-10 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-full text-sm outline-none transition-all"
            />
            <Search className="absolute left-3 text-gray-400 w-4 h-4" />
            {isSearching && (
              <button type="button" onClick={loadData} className="absolute right-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
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
        </div>
      </div>

      {/* Story Clusters Feed */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <div className="text-sm">
              {isSearching ? "Scraping and analyzing live articles. This takes about 10-15 seconds..." : "Loading news..."}
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-700">{error}</div>
        ) : storyClusters.length === 0 || storyClusters[0].sources.length === 0 ? (
          <div className="text-sm text-gray-600">
            {isSearching
              ? 'No news available for this search.'
              : 'No news available yet.'}
          </div>
        ) : (
          storyClusters.map((cluster) => (
            <StoryCluster
              key={cluster.id}
              cluster={cluster}
              fallbackSlotByKey={fallbackSlotByKey}
            />
          ))
        )}
      </main>
    </div>
  );
}