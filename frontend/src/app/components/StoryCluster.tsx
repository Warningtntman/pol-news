import { StoryCluster as StoryClusterType } from '../data/mockData';
import { SourceCard } from './SourceCard';

interface StoryClusterProps {
  cluster: StoryClusterType;
  fallbackSlotByKey: Map<string, number>;
}

export function StoryCluster({ cluster, fallbackSlotByKey }: StoryClusterProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="font-['Merriweather'] font-bold text-2xl text-gray-900">
          {cluster.mainHeadline}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cluster.sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            storyId={cluster.id}
            storyTitle={cluster.mainHeadline}
            fallbackSlot={fallbackSlotByKey.get(`${cluster.id}:${source.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
