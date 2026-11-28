// Ordering BBO's card list by Title or Partner (ui/list-order.js). BBO lists
// your favourite card first, then cards without a partner by title, then the
// rest by partner; with no sort chosen, that order stands.

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

export const SORT_KEYS = ['title', 'partner']

/** The sort after a click on `key`'s heading: ascending, descending, then BBO's own order. */
export function nextSort(sort, key) {
  if (sort?.key !== key) return { key, dir: 'asc' }
  if (sort.dir === 'asc') return { key, dir: 'desc' }
  return null
}

/** A saved sort made safe: anything else is BBO's order (null). */
export function normalizeSort(saved) {
  return saved && SORT_KEYS.includes(saved.key) && ['asc', 'desc'].includes(saved.dir) ? { key: saved.key, dir: saved.dir } : null
}

/**
 * `rows` in the order to show them: each { title, partner, favorite, order },
 * where `order` is BBO's position. The favourite stays first; sorted by
 * partner, cards without one go last whichever way; ties go by title, then
 * BBO's order.
 */
export function sortRows(rows, sort) {
  const s = normalizeSort(sort)
  const flip = s?.dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
    if (!s) return a.order - b.order
    if (s.key === 'partner') {
      if (!a.partner !== !b.partner) return a.partner ? -1 : 1
      const byPartner = collator.compare(a.partner, b.partner)
      if (byPartner) return flip * byPartner
    }
    return flip * collator.compare(a.title, b.title) || a.order - b.order
  })
}
