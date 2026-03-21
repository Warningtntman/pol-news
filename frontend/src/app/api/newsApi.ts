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

function mapArticleToSource(record: any): SourceArticle {
  const publisher = String(record?.source ?? record?.publisher ?? '').trim()
  const headline = String(record?.title ?? record?.headline ?? '').trim()
  const url = String(record?.link ?? record?.url ?? '#')

  // UI currently shows a short text logo (e.g. `NYT`) instead of an image.
  const publisherLogo = publisher ? publisher.slice(0, 3).toUpperCase() : 'N/A'

  return {
    id: String(record?.article_id ?? record?.id ?? ''),
    publisher,
    publisherLogo,
    headline,
    url,
    bias: mapBias(record),
  }
}

export async function fetchNewsStoryClusters(): Promise<StoryCluster[]> {
  const res = await fetch('/api/news')
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

