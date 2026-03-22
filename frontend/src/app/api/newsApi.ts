import type { BiasScore, SourceArticle, StoryCluster } from '../data/mockData'

const LATEST_CLUSTER_ID = 'latest'
const LATEST_CLUSTER_TITLE = 'Latest Political News'

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function extractRecords(payload: any): any[] {
  if (Array.isArray(payload)) return payload

  if (Array.isArray(payload?.articles)) return payload.articles
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.data)) return payload.data

  // InsForge-like shapes (best-effort).
  if (Array.isArray(payload?.articles?.records)) return payload.articles.records
  if (Array.isArray(payload?.articles?.data)) return payload.articles.data

  return []
}

function mapBias(record: any): BiasScore {
  return {
    left: toNumber(record?.bias_left),
    center: toNumber(record?.bias_center),
    right: toNumber(record?.bias_right),
  }
}

function faviconUrl(url: string): string | undefined {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return undefined
  }
}

function mapArticleToSource(record: any): SourceArticle {
  const publisher = String(record?.source ?? record?.publisher ?? '').trim()
  const headline = String(record?.title ?? record?.headline ?? '').trim()
  const url = String(record?.link ?? record?.url ?? '#')

  const publisherLogo = publisher ? publisher.slice(0, 3).toUpperCase() : 'N/A'

  return {
    id: String(record?.article_id ?? record?.id ?? ''),
    publisher,
    publisherLogo,
    iconUrl: faviconUrl(url),
    headline,
    url,
    bias: mapBias(record),
  }
}

const NEWS_URL = import.meta.env.VITE_NEWS_URL ?? '/api/news'
const SEARCH_URL = import.meta.env.VITE_SEARCH_URL ?? '/api/search'

export async function fetchNewsStoryClusters(): Promise<StoryCluster[]> {
  const res = await fetch(NEWS_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/news (${res.status})`)
  }

  const payload = await res.json()
  const records = extractRecords(payload)

  const sources = records.map(mapArticleToSource)
  const latestTimestamp = records[0]?.date ?? new Date().toISOString()

  const cluster: StoryCluster = {
    id: LATEST_CLUSTER_ID,
    mainHeadline: LATEST_CLUSTER_TITLE,
    timestamp: typeof latestTimestamp === 'string' ? latestTimestamp : String(latestTimestamp),
    sources,
  }

  return [cluster]
}

export async function searchNewsStoryClusters(query: string): Promise<StoryCluster[]> {
  const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/search (${res.status})`);
  }

  const payload = await res.json();
  const records = extractRecords(payload);

  const sources = records.map(mapArticleToSource);
  const latestTimestamp = records[0]?.date ?? new Date().toISOString();

  const cluster: StoryCluster = {
    id: `search-${query}`,
    mainHeadline: `Search Results: ${query}`,
    timestamp: typeof latestTimestamp === 'string' ? latestTimestamp : String(latestTimestamp),
    sources,
  };

  return [cluster];
}