import { useCallback, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchNewsArticles, type SearchNewsMeta } from '../api/newsApi';
import type { SourceArticle } from '../data/mockData';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LEN = 2;

export interface NewsSearchBarProps {
  onResults: (items: SourceArticle[]) => void;
  onLoading: (loading: boolean) => void;
  onError: (message: string | null) => void;
  /** Optional API warning (e.g. NewsData key missing) */
  onWarning?: (message: string | null) => void;
  /** NewsData meta from last successful search response */
  onMeta?: (meta: SearchNewsMeta | null) => void;
  /** Fired on every change so the parent can show/hide the search section */
  onQueryChange?: (query: string) => void;
}

export function NewsSearchBar({
  onResults,
  onLoading,
  onError,
  onWarning,
  onMeta,
  onQueryChange,
}: NewsSearchBarProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    onQueryChange?.(value);
  }, [value, onQueryChange]);

  useEffect(() => {
    const trimmed = value.trim();

    if (trimmed.length < MIN_QUERY_LEN) {
      onResults([]);
      onError(null);
      onWarning?.(null);
      onMeta?.(null);
      onLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      onLoading(true);
      onError(null);
      onWarning?.(null);
      onMeta?.(null);
      try {
        const { sources, warning, meta } = await searchNewsArticles(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          onWarning?.(warning ?? null);
          onMeta?.(meta ?? null);
          onResults(sources);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          onWarning?.(null);
          onMeta?.(null);
          onResults([]);
          onError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!controller.signal.aborted) {
          onLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, onResults, onLoading, onError, onWarning, onMeta]);

  const clear = useCallback(() => {
    setValue('');
  }, []);

  return (
    <div className="relative max-w-xl">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="text"
        role="searchbox"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search live political news…"
        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 font-['Inter'] text-sm text-gray-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search news"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
