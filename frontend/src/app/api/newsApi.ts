import type { BiasScore, SourceArticle, StoryCluster } from '../data/mockData'

type RawCluster = {
  id?: string
  title?: string
  timestamp?: string
  article_ids?: string[]
  perspectives?: { left?: string; center?: string; right?: string }
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

function extractClusters(payload: any): RawCluster[] {
  if (Array.isArray(payload?.clusters)) return payload.clusters
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
  const clusters = extractClusters(payload)
  const sourceById = new Map<string, SourceArticle>()

  records.forEach((record) => {
    const source = mapArticleToSource(record)
    sourceById.set(source.id, source)
  })

  if (clusters.length > 0) {
    return clusters.map((cluster, idx) => {
      const clusterSources = (cluster.article_ids ?? [])
        .map((id) => sourceById.get(String(id)))
        .filter((value): value is SourceArticle => Boolean(value))

      return {
        id: String(cluster.id ?? `cluster-${idx + 1}`),
        mainHeadline: String(cluster.title ?? `Topic ${idx + 1}`),
        timestamp: String(cluster.timestamp ?? new Date().toISOString()),
        sources: clusterSources,
        perspectives: {
          left: String(cluster.perspectives?.left ?? ''),
          center: String(cluster.perspectives?.center ?? ''),
          right: String(cluster.perspectives?.right ?? ''),
        },
      }
    }).filter((cluster) => cluster.sources.length > 0)
  }

  // Fallback for old backend shape without `clusters`.
  return [{
    id: 'latest',
    mainHeadline: 'Latest Political News',
    timestamp: String(records[0]?.date ?? new Date().toISOString()),
    sources: records.map(mapArticleToSource),
  }]
}

