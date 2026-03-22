import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { StoryCluster } from '../components/StoryCluster';
import type { StoryCluster as StoryClusterType } from '../data/mockData';
import { fetchNewsStoryClusters } from '../api/newsApi';
import { Link } from 'react-router';

export function FeedPage() {
  const [storyClusters, setStoryClusters] = useState<StoryClusterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

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
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-700" />
          <span className="text-sm text-yellow-900 font-medium">
            Live Sync: {updatedText}
          </span>
        </div>
      </div>

      {/* Story Clusters Feed */}
      <main className="max-w-5xl mx-auto px-4 py-6">
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
