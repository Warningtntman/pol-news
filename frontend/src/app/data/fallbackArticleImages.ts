/**
 * Curated Unsplash URLs for article cards when the API has no image or load fails.
 * News / politics / civic themes; keep params consistent for caching.
 */
import type { StoryCluster } from './mockData'

const Q = 'w=800&q=80&auto=format&fit=crop'

export const FALLBACK_ARTICLE_IMAGES: readonly string[] = [
  `https://images.unsplash.com/photo-1504711434969-e33886168f5c?${Q}`,
  `https://images.unsplash.com/photo-1586339949916-5c7bec476762?${Q}`,
  `https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?${Q}`,
  `https://images.unsplash.com/photo-1673121209001-e996ecf40807?${Q}`,
  `https://images.unsplash.com/photo-1467251589161-f9c68fa14c59?${Q}`,
  `https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?${Q}`,
  `https://images.unsplash.com/photo-1475721027785-f74eccf877e2?${Q}`,
  `https://images.unsplash.com/photo-1522071820081-009f0129c71c?${Q}`,
  `https://images.unsplash.com/photo-1572949645841-094f288a56c7?${Q}`,
  `https://images.unsplash.com/photo-1557804506-669a67965ba0?${Q}`,
  `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?${Q}`,
  `https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?${Q}`,
] as const

/** Stable index 0..length-1 from a string (same seed → same image). */
export function fallbackImageIndexForSeed(seed: string, length = FALLBACK_ARTICLE_IMAGES.length): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h) % length
}

export function getFallbackArticleImageAt(seed: string, offset = 0): string {
  const n = FALLBACK_ARTICLE_IMAGES.length
  const idx = (fallbackImageIndexForSeed(seed, n) + offset) % n
  return FALLBACK_ARTICLE_IMAGES[idx]
}

export function getFallbackBySlot(slot: number): string {
  const n = FALLBACK_ARTICLE_IMAGES.length
  const idx = ((slot % n) + n) % n
  return FALLBACK_ARTICLE_IMAGES[idx]
}

/**
 * For sources without imageUrl, assign distinct pool indices in feed order until the pool
 * is exhausted, then clear and repeat.
 */
export function assignUniqueFallbackSlots(clusters: StoryCluster[]): Map<string, number> {
  const map = new Map<string, number>()
  const n = FALLBACK_ARTICLE_IMAGES.length
  const used = new Set<number>()

  for (const cluster of clusters) {
    for (const source of cluster.sources) {
      if (source.imageUrl) continue
      const key = `${cluster.id}:${source.id}`

      let slot = 0
      while (slot < n && used.has(slot)) slot++
      if (slot >= n) {
        used.clear()
        slot = 0
      }
      used.add(slot)
      map.set(key, slot)
    }
  }
  return map
}
