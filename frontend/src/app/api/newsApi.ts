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

/** Search endpoint returns `{ articles: SourceRow[] }`; avoid mixing with other InsForge shapes. */
function extractSearchArticleRecords(payload: any): any[] {
  if (payload == null || typeof payload !== 'object') return []
  if (Array.isArray(payload.articles)) return payload.articles
  // If a proxy ever forwards a raw NewsData body, `results` holds rows.
  if (Array.isArray(payload.results)) return payload.results
  return extractRecords(payload)
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
  const res = await fetch(apiUrl('/api/news'))
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

/** Mirrors `/api/search` response `meta` (NewsData summary, no secrets). */
export interface SearchNewsMeta {
  totalResults: number | null
  newsdataStatus: string | null
}

function parseSearchMeta(raw: unknown): SearchNewsMeta | undefined {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const m = raw as Record<string, unknown>
  const tr = m.totalResults
  let totalResults: number | null = null
  if (typeof tr === 'number' && Number.isFinite(tr)) {
    totalResults = tr
  } else if (tr != null && String(tr).trim() !== '') {
    const n = Number(tr)
    totalResults = Number.isFinite(n) ? n : null
  }
  const ns = m.newsdata_status
  const newsdataStatus = typeof ns === 'string' ? ns : ns != null ? String(ns) : null
  return { totalResults, newsdataStatus }
}

export interface SearchNewsArticlesResult {
  sources: SourceArticle[]
  /** Server-side hint (e.g. missing NEWSDATA_API_KEY) */
  warning?: string
  meta?: SearchNewsMeta
}

export async function searchNewsArticles(
  query: string,
  signal?: AbortSignal,
): Promise<SearchNewsArticlesResult> {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { sources: [] }
  }

  const searchUrl = `${apiUrl('/api/search')}?q=${encodeURIComponent(trimmed)}`

  const res = await fetch(searchUrl, {
    signal,
  })

  if (!res.ok) {
    let detail = `Search failed (${res.status})`
    try {
      const errBody = await res.json()
      if (typeof errBody?.detail === 'string') {
        detail = errBody.detail
      }
    } catch {
      // ignore
    }
    throw new Error(detail)
  }

  const payload = await res.json()
  if (payload?.status === 'error') {
    const msg =
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : 'NewsData API error'
    throw new Error(msg)
  }
  const records = extractSearchArticleRecords(payload)
  const warning = typeof payload?.warning === 'string' ? payload.warning : undefined
  const meta = parseSearchMeta(payload?.meta)
  const sources = records.map(mapArticleToSource)
  return {
    sources,
    warning,
    meta,
  }
}

