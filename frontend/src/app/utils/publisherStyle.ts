/**
 * Brand-leaning accent colors for publisher avatars (initials fallback).
 * Match is substring on lowercased publisher name.
 */
export function getPublisherAccent(publisher: string): {
  className: string
  textClass: string
} {
  const p = publisher.toLowerCase()

  const pick = (bg: string, text: string) => ({
    className: `${bg} border-0`,
    textClass: text,
  })

  if (p.includes('fox')) return pick('bg-[#C8102E]', 'text-white')
  if (p.includes('cnn')) return pick('bg-[#CC0000]', 'text-white')
  if (p.includes('ny times') || p.includes('new york times')) return pick('bg-gray-900', 'text-white')
  if (p.includes('wall street') || p.includes('wsj')) return pick('bg-sky-900', 'text-white')
  if (p.includes('cbs')) return pick('bg-[#162694]', 'text-white')
  if (p.includes('nbc') || p.includes('msnbc')) return pick('bg-indigo-800', 'text-white')
  if (p.includes('abc news') || (p.includes('abc') && p.includes('news')))
    return pick('bg-slate-800', 'text-white')
  if (p.includes('reuters')) return pick('bg-orange-800', 'text-white')
  if (p.includes('bbc')) return pick('bg-[#BB1919]', 'text-white')
  if (p.includes('guardian')) return pick('bg-blue-950', 'text-white')
  if (p.includes('washington post') || p.includes('wapo')) return pick('bg-slate-900', 'text-white')
  if (p.includes('npr')) return pick('bg-[#D62021]', 'text-white')
  if (p.includes('politico')) return pick('bg-red-900', 'text-white')
  if (p.includes('bloomberg')) return pick('bg-[#2800D7]', 'text-white')
  if (p.includes('associated press') || p === 'ap') return pick('bg-red-800', 'text-white')
  if (p.includes('national review')) return pick('bg-red-950', 'text-white')

  return {
    className: 'bg-gray-100 border border-gray-200',
    textClass: 'text-gray-700',
  }
}
