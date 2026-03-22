import { StoryCluster as StoryClusterType } from '../data/mockData';
import { SourceCard } from './SourceCard';

interface StoryClusterProps {
  cluster: StoryClusterType;
}

export function StoryCluster({ cluster }: StoryClusterProps) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="font-['Merriweather'] font-bold text-2xl text-gray-900 mb-2">
          {cluster.mainHeadline}
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Perspective summaries</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1">Left</div>
            <p className="text-sm text-gray-800">{cluster.perspectives?.left || 'No left summary available.'}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">Center</div>
            <p className="text-sm text-gray-800">{cluster.perspectives?.center || 'No center summary available.'}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">Right</div>
            <p className="text-sm text-gray-800">{cluster.perspectives?.right || 'No right summary available.'}</p>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Same story — different sources (scroll sideways)
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" role="list" aria-label="Articles for this story">
        {cluster.sources.map((source) => (
          <SourceCard key={source.id} source={source} storyId={cluster.id} />
        ))}
      </div>
    </section>
  );
}
