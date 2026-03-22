import { useMemo, useState } from 'react';
import { SourceArticle } from '../data/mockData';
import { BiasMeter } from './BiasMeter';
import { Link } from 'react-router';
import { getPublisherAccent } from '../utils/publisherStyle';
import { getFallbackArticleImageAt } from '../data/fallbackArticleImages';

interface SourceCardProps {
  source: SourceArticle;
  storyId: string;
  storyTitle: string;
}

export function SourceCard({ source, storyId, storyTitle }: SourceCardProps) {
  const [iconError, setIconError] = useState(false);
  /** Primary API image failed or was rejected */
  const [primaryImageFailed, setPrimaryImageFailed] = useState(false);
  /** Rotate through library when a fallback URL fails to load */
  const [fallbackOffset, setFallbackOffset] = useState(0);

  const thumbSeed = useMemo(() => `${storyId}:${source.id}`, [storyId, source.id]);

  const usePrimary = Boolean(source.imageUrl) && !primaryImageFailed;
  const thumbSrc = usePrimary
    ? source.imageUrl!
    : getFallbackArticleImageAt(thumbSeed, fallbackOffset);

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
          onError={() => {
            if (source.imageUrl && !primaryImageFailed) {
              setPrimaryImageFailed(true);
              setFallbackOffset(0);
            } else {
              setFallbackOffset((o) => o + 1);
            }
          }}
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
