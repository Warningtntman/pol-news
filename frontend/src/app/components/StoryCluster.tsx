import { StoryCluster as StoryClusterType } from '../data/mockData';
import { SourceCard } from './SourceCard';
import { Clock } from 'lucide-react';

interface StoryClusterProps {
  cluster: StoryClusterType;
}

export function StoryCluster({ cluster }: StoryClusterProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="font-['Merriweather'] font-bold text-2xl text-gray-900 mb-2">
          {cluster.mainHeadline}
        </h2>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-['Inter']">
          <Clock className="w-4 h-4" />
          <span>{cluster.timestamp}</span>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cluster.sources.map((source) => (
          <SourceCard key={source.id} source={source} storyId={cluster.id} />
        ))}
      </div>
    </div>
  );
}
