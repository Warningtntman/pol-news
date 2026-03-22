import { useMemo, useState } from 'react';
import type { SourceArticle } from '../data/mockData';
import { getPublisherAccent } from '../utils/publisherStyle';
import { getFallbackArticleImageAt } from '../data/fallbackArticleImages';

interface SearchArticleCardProps {
  source: SourceArticle;
}

/**
 * Live search hit: opens the publisher URL in a new tab (not in-app /article/...).
 */
export function SearchArticleCard({ source }: SearchArticleCardProps) {
  const [iconError, setIconError] = useState(false);
  const [primaryImageFailed, setPrimaryImageFailed] = useState(false);
  const [fallbackOffset, setFallbackOffset] = useState(0);

  const thumbSeed = useMemo(() => `search:${source.id}`, [source.id]);

  const usePrimary = Boolean(source.imageUrl) && !primaryImageFailed;
  const thumbSrc = usePrimary
    ? source.imageUrl!
    : getFallbackArticleImageAt(thumbSeed, fallbackOffset);

  const accent = getPublisherAccent(source.publisher);
  const href = source.url && source.url !== '#' ? source.url : undefined;

  const inner = (
    <>
      <div className="relative flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden bg-slate-200">
        <img
          src={thumbSrc}
          alt=""
          className="max-h-full max-w-full object-contain object-center"
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
                className="max-h-full max-w-full object-contain object-center"
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
              {source.publisher || 'Unknown source'}
            </span>
            <span className="block truncate font-['Inter'] text-xs font-medium text-slate-500">
              Live search (not analyzed)
            </span>
          </div>
        </div>

        <h3 className="mb-4 line-clamp-3 flex-1 font-['Inter'] text-base font-semibold text-gray-900">
          {source.headline}
        </h3>

        <p className="mt-auto border-t border-gray-100 pt-2 font-['Inter'] text-xs text-slate-500">
          Bias not analyzed — opens article in a new tab
        </p>
      </div>
    </>
  );

  const cardClass =
    'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md';

  if (!href) {
    return (
      <div className={`${cardClass} cursor-not-allowed opacity-60`} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClass}
    >
      {inner}
    </a>
  );
}
