import { useMemo, useState } from 'react';
import { SourceArticle } from '../data/mockData';
import { BiasMeter } from './BiasMeter';
import { Link } from 'react-router';
import { getPendingSearchArticleStorageKey } from '../api/newsApi';
import { getPublisherAccent } from '../utils/publisherStyle';
import {
  getFallbackArticleImageAt,
  getFallbackBySlot,
} from '../data/fallbackArticleImages';

interface SourceCardProps {
  source: SourceArticle;
  storyId: string;
  storyTitle: string;
  fallbackSlot?: number;
}

const CARD_CLASS =
  "font-['Inter'] flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md";

export function SourceCard({
  source,
  storyId,
  storyTitle,
  fallbackSlot,
}: SourceCardProps) {
  const [iconError, setIconError] = useState(false);
  const [primaryImageFailed, setPrimaryImageFailed] = useState(false);
  const [thumbHidden, setThumbHidden] = useState(false);

  const thumbSeed = useMemo(() => `${storyId}:${source.id}`, [storyId, source.id]);

  const usePrimary = Boolean(source.imageUrl) && !primaryImageFailed;
  const thumbSrc = usePrimary
    ? source.imageUrl!
    : fallbackSlot !== undefined
      ? getFallbackBySlot(fallbackSlot)
      : getFallbackArticleImageAt(thumbSeed, 0);

  const accent = getPublisherAccent(source.publisher);
  const isSearchResult = storyId.startsWith('search-');

  const cardInner = (
    <>
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-200">
        {!thumbHidden && (
          <img
            key={thumbSrc}
            src={thumbSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
            onError={() => {
              if (source.imageUrl && !primaryImageFailed) {
                setPrimaryImageFailed(true);
              } else {
                setThumbHidden(true);
              }
            }}
            loading="lazy"
          />
        )}
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
              <span className={`text-xs font-semibold ${accent.textClass}`}>
                {source.publisherLogo}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-900">
              {source.publisher}
            </span>
            <span className="block truncate text-xs font-medium text-slate-500">
              {storyTitle}
            </span>
          </div>
        </div>

        <h3 className="mb-4 line-clamp-3 flex-1 text-base font-semibold text-gray-900">
          {source.headline}
        </h3>

        <div className="mt-auto pt-1">
          <BiasMeter bias={source.bias} />
        </div>
      </div>
    </>
  );

  if (isSearchResult) {
    const targetPath = `/article/latest/${source.id}`;
    return (
      <a
        href={targetPath}
        className={CARD_CLASS}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          try {
            sessionStorage.setItem(getPendingSearchArticleStorageKey(source.id), JSON.stringify(source));
          } catch {
            // Continue navigation even if storage is unavailable.
          }
        }}
      >
        {cardInner}
      </a>
    );
  }

  /* For cached feed articles, open the in-app article view directly. */
  return (
    <Link to={`/article/${storyId}/${source.id}`} className={CARD_CLASS}>
      {cardInner}
    </Link>
  );
}
