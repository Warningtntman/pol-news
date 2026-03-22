/**
 * Format a Date using the browser's local clock: YYYY-MM-DD HH:mm:ss
 */
export function formatBrowserLocalDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const sec = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`
}

/**
 * Parse a backend date string into a Date, then display in the browser's local timezone.
 *
 * - ISO strings with `Z` or a numeric offset → correct instant, shown in local time.
 * - Naive "YYYY-MM-DD HH:mm:ss" (no zone) → interpreted as **local wall time** in the
 *   user's browser (not UTC), which matches what people expect for feed timestamps.
 */
function parseToDate(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  // Has explicit UTC (Z) or offset (+hh:mm / -hh:mm) — use native parse (instant → local display).
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed) || /[+-]\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed)
    if (!Number.isNaN(d.getTime())) return d
  }

  // Naive "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss" — local components (no UTC shift).
  const m = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/,
  )
  if (m) {
    const [, y, mo, day, h, min, sec, frac] = m
    const secNum = sec != null && sec !== '' ? Number(sec) : 0
    const ms =
      frac != null && frac !== ''
        ? Number(String(frac).padEnd(3, '0').slice(0, 3))
        : 0
    const d = new Date(
      Number(y),
      Number(mo) - 1,
      Number(day),
      Number(h),
      Number(min),
      secNum,
      ms,
    )
    if (!Number.isNaN(d.getTime())) return d
  }

  // Fallback: let the engine parse (handles many RFC / ISO shapes).
  const d = new Date(trimmed)
  if (!Number.isNaN(d.getTime())) return d

  return null
}

/**
 * Format a date string for display in the user's browser local time: YYYY-MM-DD HH:mm:ss
 */
export function formatBrowserLocalTimestamp(value?: string | null): string {
  if (value == null || String(value).trim() === '') return '—'

  const d = parseToDate(String(value))
  if (!d) return String(value)

  return formatBrowserLocalDate(d)
}
