import { useState, useCallback } from 'react';
import { searchNews } from '../api/client';
import type { SearchResponse } from '../types';

interface SearchState {
  data: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  lastQuery: string;
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    data: null,
    isLoading: false,
    error: null,
    lastQuery: '',
  });

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setState({ data: null, isLoading: true, error: null, lastQuery: query });
    try {
      const data = await searchNews(query.trim());
      setState({ data, isLoading: false, error: null, lastQuery: query });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        lastQuery: query,
      });
    }
  }, []);

  return { ...state, search };
}
