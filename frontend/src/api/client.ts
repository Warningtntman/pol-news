import type { SearchResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001';

export async function searchNews(
  query: string,
  description = '',
  maxResults = 25,
): Promise<SearchResponse> {
  const url = new URL(`${API_BASE}/api/search`);
  url.searchParams.set('q', query);
  if (description) url.searchParams.set('description', description);
  url.searchParams.set('max_results', String(maxResults));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Server error ${res.status}`);
  }
  return res.json() as Promise<SearchResponse>;
}
