// What to do with each card in an imported file, without touching BBO. Follows
// the convention-card library's planImport (add / same / ask), with BBO's rules:
//
//   - A card someone else owns, or a stock card, is never overwritten: the
//     file's copy becomes a private card of the user's, "<title> (private)".
//   - A card matching one of the user's own, by cc_key or else by title, is
//     skipped when the settings are the same, and asked about when they differ.
//     Title matters as well as key because the file may come from another
//     account, and because BBO's save can hand back a new cc_key.
//   - BBO records no dates, so the extension keeps its own in the card, as the
//     field below. A card saved without the extension has none, so nothing is
//     replaced unasked: the dates inform the question, they don't answer it.
//
// Only ACBL cards are imported. Other styles may hold elements our parser
// doesn't read, which a replace would lose.

const FAMILIES = ['fields', 'conventions', 'leads']

/** When a card was last saved, seconds since 1970: `<E_bbccSaved t="…"/>` in the card. */
export const SAVED_FIELD = 'bbccSaved'

/** When `card` was last saved as a Date, or null if it has no date. */
export function savedAt(card) {
  const seconds = Number(card?.fields?.[SAVED_FIELD])
  return seconds > 0 ? new Date(seconds * 1000) : null
}

/**
 * Which copy is newer, 'file' or 'bbo', or null if the dates can't say. A file
 * card with no date of its own is no newer than the file's export.
 */
export function newerCopy(fileCard, bboCard, exportedAt) {
  const file = savedAt(fileCard)
  const bbo = savedAt(bboCard)
  if (!bbo) return null
  if (!file) return bbo > new Date(exportedAt) ? 'bbo' : null
  if (file.getTime() === bbo.getTime()) return null
  return file > bbo ? 'file' : 'bbo'
}

const sameUser = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase()

/** One card's settings as `family/name` → value. BBO's save omits blanks, so they don't count, and when it was saved isn't a setting. */
function settings(card) {
  const out = new Map()
  for (const family of FAMILIES) {
    for (const [name, value] of Object.entries(card?.[family] ?? {})) {
      if (name === SAVED_FIELD) continue
      if (value != null && value !== '') out.set(`${family}/${name}`, String(value))
    }
  }
  return out
}

/** How many settings differ between two cards. */
export function countDifferences(a, b) {
  const ours = settings(a)
  const theirs = settings(b)
  let count = 0
  for (const [key, value] of ours) if (theirs.get(key) !== value) count += 1
  for (const key of theirs.keys()) if (!ours.has(key)) count += 1
  return count
}

/**
 * Plan an import. `fetchCard(cc_key)` resolves to a parsed card from BBO; it is
 * called only for cards a file card matched. Each entry is `{ card, action }`:
 *   skip   `reason` says why
 *   same   `target`: the settings already match this list item
 *   add    a new card, `title`
 *   copy   a new private copy of someone else's card, `title`
 *   ask    differs from `target` by `differences` settings; `bothTitle` is
 *          the new card's title if the user keeps both; `bboSaved` and `newer`
 *          say when the card on BBO was saved and which copy is newer, if known
 */
export async function planImport(fileCards, listItems, me, fetchCard, { exportedAt } = {}) {
  const isOwn = (item) => !item.stock && sameUser(item.owner, me)
  const byKey = new Map()
  for (const item of listItems) if (!byKey.has(item.cc_key)) byKey.set(item.cc_key, item)

  const taken = new Set(listItems.map((i) => i.title))
  const unique = (base) => {
    let title = base
    for (let n = 2; taken.has(title); n += 1) title = `${base} ${n}`
    taken.add(title)
    return title
  }

  // A title matches one of the user's cards once per file: BBO allows several
  // cards of one title, and two cards in a file aren't both that card.
  const claimed = new Set()
  const ownNamed = (title) => {
    const item = listItems.find(
      (i) => isOwn(i) && i.title === title && !claimed.has(i.cc_key)
    )
    if (item) claimed.add(item.cc_key)
    return item ?? null
  }

  const compare = async (card, target, bothBase) => {
    const live = await fetchCard(target.cc_key)
    const differences = countDifferences(card, live)
    if (differences === 0) return { card, action: 'same', target }
    return {
      card,
      action: 'ask',
      target,
      differences,
      bothTitle: unique(bothBase),
      bboSaved: savedAt(live),
      newer: newerCopy(card, live, exportedAt),
    }
  }

  const plan = []
  for (const card of fileCards) {
    if (!FAMILIES.some((family) => card?.[family])) {
      plan.push({ card, action: 'skip', reason: 'not a card exported from BBO' })
      continue
    }
    const title = card.title || 'Untitled'
    if ((card.style ?? 'ACBL') !== 'ACBL') {
      plan.push({ card, action: 'skip', reason: `${card.style} cards can't be imported yet` })
      continue
    }

    const listed = card.cc_key ? byKey.get(card.cc_key) : null
    const foreign = listed
      ? !isOwn(listed)
      : !!card.stock || (!!card.owner && !sameUser(card.owner, me))

    if (foreign) {
      // Nothing to do if it's still what the shared or stock card says.
      if (listed && countDifferences(card, await fetchCard(listed.cc_key)) === 0) {
        plan.push({ card, action: 'same', target: listed })
        continue
      }
      const privateTitle = `${title} (private)`
      const target = ownNamed(privateTitle)
      plan.push(
        target
          ? await compare(card, target, `${privateTitle} (imported)`)
          : { card, action: 'copy', title: unique(privateTitle) }
      )
      continue
    }

    if (listed) claimed.add(listed.cc_key)
    const target = listed ?? ownNamed(title)
    plan.push(
      target
        ? await compare(card, target, `${target.title} (imported)`)
        : { card, action: 'add', title: unique(title) }
    )
  }
  return plan
}

/**
 * The saves a plan comes to, once each `ask` entry has its `choice`: 'keep',
 * 'replace' or 'both'. A replace keeps the title, partner and favourite of the
 * card on BBO, as only its settings come from the file. Anything new is private.
 * A card keeps the date it came with, so restoring a backup doesn't make it look
 * new; one with no date is saved as of `now`, in seconds.
 */
export function planWrites(plan, now = Math.floor(Date.now() / 1000)) {
  const writes = []
  for (const entry of plan) {
    const { action, target, choice } = entry
    const card = {
      ...entry.card,
      fields: { ...entry.card.fields, [SAVED_FIELD]: entry.card.fields?.[SAVED_FIELD] ?? String(now) },
    }
    if (action === 'add' || action === 'copy') {
      writes.push({ cmd: 'insert', card: { ...card, title: entry.title, partner: '', default: false } })
    } else if (action === 'ask' && choice === 'both') {
      writes.push({ cmd: 'insert', card: { ...card, title: entry.bothTitle, partner: '', default: false } })
    } else if (action === 'ask' && choice === 'replace') {
      writes.push({
        cmd: 'replace',
        card: { ...card, cc_key: target.cc_key, title: target.title, partner: target.partner, default: target.default },
      })
    }
  }
  return writes
}
