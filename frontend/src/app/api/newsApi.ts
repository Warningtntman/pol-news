import type { BiasScore, SourceArticle, StoryCluster } from '../data/mockData'

const LATEST_CLUSTER_ID = 'latest'
const LATEST_CLUSTER_TITLE = 'Latest Political News'

/** Same default as vite.config proxy target; avoids 404 when proxy is bypassed (e.g. vite preview). */
function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const raw = import.meta.env.VITE_BACKEND_URL as string | undefined
  const explicit = raw?.trim().replace(/\/$/, '')
  if (explicit) return `${explicit}${p}`
  if (import.meta.env.DEV) return `http://127.0.0.1:8000${p}`
  if (typeof window !== 'undefined' && window.location?.port) {
    const port = window.location.port
    // vite preview / static dev ports have no /api proxy — call API on :8000
    if (['5173', '4173', '3000'].includes(port)) {
      const host = window.location.hostname || '127.0.0.1'
      return `http://${host}:8000${p}`
    }
  }
  return p
}

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

const NEUTRAL_BIAS: BiasScore = { left: 34, center: 33, right: 33 }

function mapBias(record: any): BiasScore {
  const left = toNumber(record?.bias_left)
  const center = toNumber(record?.bias_center)
  const right = toNumber(record?.bias_right)
  // Raw NewsData / search hits have no bias fields; treat all-zero as neutral display.
  if (left + center + right === 0) {
    return NEUTRAL_BIAS
  }
  return { left, center, right }
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

  const rawImage = record?.image ?? record?.image_url ?? record?.thumbnail
  const imageUrl =
    typeof rawImage === 'string' && rawImage.trim() ? rawImage.trim() : undefined

  return {
    id: String(record?.article_id ?? record?.id ?? ''),
    publisher,
    publisherLogo,
    iconUrl: faviconUrl(url),
    imageUrl,
    headline,
    url,
    bias: mapBias(record),
  }
}

export async function fetchNewsStoryClusters(): Promise<StoryCluster[]> {
  const backendBase = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim().replace(/\/$/, '')
  const url = backendBase ? `${backendBase}/functions/news-api` : apiUrl('/api/news')
  const res = await fetch(url)
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
  const backendBase = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim().replace(/\/$/, '')
  const base = backendBase ? `${backendBase}/functions/news-search` : apiUrl('/api/search')
  const res = await fetch(`${base}?q=${encodeURIComponent(query)}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/search (${res.status})`)
  }

  const payload = await res.json()
  const records = extractRecords(payload)

  const sources = records.map(mapArticleToSource)
  const latestTimestamp = records[0]?.date ?? new Date().toISOString()

  const cluster: StoryCluster = {
    id: `search-${query}`,
    mainHeadline: `Search Results: ${query}`,
    timestamp: typeof latestTimestamp === 'string' ? latestTimestamp : String(latestTimestamp),
    sources,
  }

  return [cluster]
}
