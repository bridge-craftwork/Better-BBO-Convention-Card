// Parse BBO's cc_list.php and cc_fetch.php XML responses into plain JS data.
//
// cc_list.php → list of card metadata (one entry per (card, partner) pair).
// cc_fetch.php → one full card. The interesting part is the `cc` attribute,
// which is HTML-entity-encoded XML containing every `E_*` field of the card.
//
// We use DOMParser, which is present in browser content-script contexts and
// in the jsdom environment used by vitest. No third-party XML parser needed.

const DEFAULT_PARSER = () => new DOMParser()

/**
 * Parse the response from `cc_list.php`. Returns an array of objects with
 * one entry per `<cc_listitem>` element.
 *
 * Throws if the document isn't well-formed XML or the root indicates an
 * error (`err` attribute non-zero).
 */
export function parseCardList(xmlString, { parser = DEFAULT_PARSER } = {}) {
  const doc = parser().parseFromString(xmlString, 'application/xml')
  throwIfParserError(doc)

  const root = doc.documentElement
  if (root.nodeName !== 'cc_list') {
    throw new Error(`Expected <cc_list> root, got <${root.nodeName}>`)
  }
  const err = root.getAttribute('err')
  if (err && err !== '0') {
    throw new Error(`cc_list returned err=${err}`)
  }

  const items = Array.from(root.getElementsByTagName('cc_listitem'))
  return items.map((el) => ({
    cc_key: el.getAttribute('cc_key') ?? '',
    title: el.getAttribute('title') ?? '',
    partner: el.getAttribute('partner') ?? '',
    owner: el.getAttribute('owner') ?? '',
    style: el.getAttribute('style') ?? '',
    stock: parseStockFlag(el.getAttribute('stock')),
    default: parseYesNoFlag(el.getAttribute('default')),
    self: el.getAttribute('self') ?? '',
  }))
}

/**
 * The keys of the cards "Export all" takes: the user's own and those shared
 * with them, not BBO's stock cards (those can still be exported one at a time
 * from the card's page). De-duplicated: BBO lists a card once per partner.
 */
export function exportAllKeys(listItems) {
  return Array.from(
    new Set(listItems.filter((i) => !i.stock).map((i) => i.cc_key))
  )
}

/**
 * Parse the response from `cc_fetch.php`. Returns a card object suitable
 * for export.
 *
 * BBO's response wraps everything in a single `<cc_card>` element whose
 * `cc` attribute contains entity-encoded XML. The DOMParser handles the
 * outer entity decoding for us when we read `.getAttribute('cc')`, so all
 * we need to do is parse the inner string as a second XML document.
 */
export function parseCardFetch(xmlString, { parser = DEFAULT_PARSER } = {}) {
  const doc = parser().parseFromString(xmlString, 'application/xml')
  throwIfParserError(doc)

  const root = doc.documentElement
  if (root.nodeName !== 'cc_card') {
    throw new Error(`Expected <cc_card> root, got <${root.nodeName}>`)
  }
  const err = root.getAttribute('err')
  if (err && err !== '0') {
    throw new Error(`cc_fetch returned err=${err}`)
  }

  const innerXml = root.getAttribute('cc') ?? ''
  const parsed = innerXml
    ? parseInnerCcXml(innerXml, { parser })
    : { fields: {}, conventions: {}, leads: {} }

  return {
    cc_key: root.getAttribute('cc_key') ?? '',
    title: root.getAttribute('title') ?? '',
    partner: '', // cc_fetch.php response carries no partner; comes from list
    owner: root.getAttribute('owner') ?? '',
    style: root.getAttribute('style') ?? '',
    stock: parseStockFlag(root.getAttribute('stock')),
    default: parseYesNoFlag(root.getAttribute('default')),
    ...parsed,
  }
}

/**
 * Parse the inner `<cc filler="..."><...></cc>` document. BBO's card XML
 * carries three distinct element families:
 *   - <E_<name> t="..."/>  — text fields (e.g., 1NT min HCP)
 *   - <C_<name> c="y"/>    — convention/checkbox flags
 *   - <L_<name> l="y"/>    — lead-card preferences
 *
 * Returns `{ fields, conventions, leads }`. The prefix and attribute
 * name are stripped from the keys — `<E_1NTMin1 t="15"/>` becomes
 * `fields['1NTMin1'] = '15'`. The `filler` attribute is discarded.
 */
export function parseInnerCcXml(innerXml, { parser = DEFAULT_PARSER } = {}) {
  const doc = parser().parseFromString(innerXml, 'application/xml')
  throwIfParserError(doc)

  const root = doc.documentElement
  if (root.nodeName !== 'cc') {
    throw new Error(`Expected <cc> inner root, got <${root.nodeName}>`)
  }

  const fields = {}
  const conventions = {}
  const leads = {}
  for (const child of Array.from(root.children)) {
    const name = child.nodeName
    if (name.startsWith('E_')) {
      fields[name.slice(2)] = child.getAttribute('t') ?? ''
    } else if (name.startsWith('C_')) {
      conventions[name.slice(2)] = child.getAttribute('c') ?? ''
    } else if (name.startsWith('L_')) {
      leads[name.slice(2)] = child.getAttribute('l') ?? ''
    }
    // Unknown prefixes are silently ignored — BBO may add new families.
  }
  return { fields, conventions, leads }
}

/**
 * Check the response from `cc_cud.php`: `<status err="0" cc_key="…"/>`.
 * Returns the card's key, which is new for an insert. Throws on anything else.
 */
export function parseSaveStatus(xmlString, { parser = DEFAULT_PARSER } = {}) {
  const doc = parser().parseFromString(xmlString, 'application/xml')
  throwIfParserError(doc)
  const status = doc.getElementsByTagName('status')[0]
  if (!status) throw new Error(`Unexpected response: ${xmlString.slice(0, 200)}`)
  const err = status.getAttribute('err')
  if (err !== '0') throw new Error(`cc_cud returned err=${err}`)
  return status.getAttribute('cc_key') ?? ''
}

function parseStockFlag(raw) {
  // cc_list uses 'y'/'N'; cc_fetch uses 'y'/'n'/'N'. Treat any case-insensitive
  // 'y' as true, everything else as false.
  return typeof raw === 'string' && raw.toLowerCase() === 'y'
}

function parseYesNoFlag(raw) {
  return typeof raw === 'string' && raw.toLowerCase() === 'y'
}

function throwIfParserError(doc) {
  // Both real-browser DOMParser and jsdom signal malformed XML by
  // returning a document containing a <parsererror> element.
  const parsererror = doc.getElementsByTagName('parsererror')[0]
  if (parsererror) {
    throw new Error(`XML parse error: ${parsererror.textContent}`)
  }
}
