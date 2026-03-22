import { useState } from 'react';
import { SourceArticle } from '../data/mockData';
import { BiasMeter } from './BiasMeter';
import { Link } from 'react-router';
import { getPublisherAccent } from '../utils/publisherStyle';

const FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80&auto=format&fit=crop';

interface SourceCardProps {
  source: SourceArticle;
  storyId: string;
  storyTitle: string;
}

export function SourceCard({ source, storyId, storyTitle }: SourceCardProps) {
  const [iconError, setIconError] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const thumbSrc =
    source.imageUrl && !thumbError ? source.imageUrl : FALLBACK_THUMBNAIL;
  const accent = getPublisherAccent(source.publisher);

  return (
    <Link
      to={`/article/${storyId}/${source.id}`}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-200">
        <img
          src={thumbSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setThumbError(true)}
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${accent.className}`}
          >
            {source.iconUrl && !iconError ? (
              <img
                src={source.iconUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setIconError(true)}
              />
            ) : (
              <span className={`font-['Inter'] text-xs font-semibold ${accent.textClass}`}>
                {source.publisherLogo}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="block truncate font-['Inter'] text-sm font-medium text-gray-900">
              {source.publisher}
            </span>
            <span className="block truncate font-['Inter'] text-xs font-medium text-slate-500">
              {storyTitle}
            </span>
          </div>
        </div>

        <h3 className="mb-4 line-clamp-3 flex-1 font-['Inter'] text-base font-semibold text-gray-900">
          {source.headline}
        </h3>

        <div className="mt-auto pt-1">
          <BiasMeter bias={source.bias} />
        </div>
      </div>
    </Link>
  );
}
