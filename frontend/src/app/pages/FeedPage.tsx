import { Zap, User } from 'lucide-react';
import { StoryCluster } from '../components/StoryCluster';
import { mockStoryClusters } from '../data/mockData';
import { Link } from 'react-router';

export function FeedPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Inter']">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="font-['Merriweather'] font-bold text-2xl text-gray-900 hover:text-blue-600 transition-colors">
              Pol-News
            </h1>
          </Link>
          <Link 
            to="/dashboard"
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            <User className="w-5 h-5 text-gray-700" />
          </Link>
        </div>
      </header>

      {/* Live Sync Banner */}
      <div className="bg-[#FEF3C7] border-b border-yellow-300">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-700" />
          <span className="text-sm text-yellow-900 font-medium">
            Live Sync: Bias Engine updated 12 mins ago
          </span>
        </div>
      </div>

      {/* Story Clusters Feed */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {mockStoryClusters.map((cluster) => (
          <StoryCluster key={cluster.id} cluster={cluster} />
        ))}
      </main>
    </div>
  );
}
