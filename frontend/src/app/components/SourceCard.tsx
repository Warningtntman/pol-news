import { SourceArticle } from '../data/mockData';
import { BiasMeter } from './BiasMeter';
import { Link } from 'react-router';

interface SourceCardProps {
  source: SourceArticle;
  storyId: string;
}

export function SourceCard({ source, storyId }: SourceCardProps) {
  return (
    <Link
      to={`/article/${storyId}/${source.id}`}
      className="block min-w-[280px] max-w-[320px] bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-['Inter'] font-semibold text-sm text-gray-700">
          {source.publisherLogo}
        </div>
        <span className="font-['Inter'] font-medium text-sm text-gray-900">
          {source.publisher}
        </span>
      </div>
      
      <h3 className="font-['Inter'] font-semibold text-base text-gray-900 mb-4 line-clamp-3">
        {source.headline}
      </h3>
      
      <BiasMeter bias={source.bias} />
    </Link>
  );
}
