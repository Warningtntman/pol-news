import { useState } from 'react';
import { SourceArticle } from '../data/mockData';
import { BiasMeter } from './BiasMeter';
import { Link } from 'react-router';

interface SourceCardProps {
  source: SourceArticle;
  storyId: string;
}

export function SourceCard({ source, storyId }: SourceCardProps) {
  const [iconError, setIconError] = useState(false);

  return (
    <Link
      to={`/article/${storyId}/${source.id}`}
      className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {source.iconUrl && !iconError ? (
            <img
              src={source.iconUrl}
              alt={source.publisher}
              className="w-full h-full object-cover"
              onError={() => setIconError(true)}
            />
          ) : (
            <span className="font-['Inter'] font-semibold text-xs text-gray-700">
              {source.publisherLogo}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <span className="font-['Inter'] font-medium text-sm text-gray-900 block truncate">
            {source.publisher}
          </span>
          <span className="font-['Inter'] text-xs text-blue-600 font-medium">
            Latest Political News
          </span>
        </div>
      </div>

      <h3 className="font-['Inter'] font-semibold text-base text-gray-900 mb-4 line-clamp-3 flex-1">
        {source.headline}
      </h3>

      <BiasMeter bias={source.bias} />
    </Link>
  );
}
