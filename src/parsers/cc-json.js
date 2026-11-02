// Serialize parsed cards to our portable JSON schema and back to BBO's XML.
//
// Forward path (cards → JSON): used by export. Wraps one or more parsed
// cards (from parseCardFetch in cc-xml.js) in an envelope with metadata.
//
// Reverse path (JSON → XML): used by import. Reconstructs the inner
// <cc filler="..."><E_x t="..."/></cc> string so it can be HTML-entity
// encoded into the `cc=` attribute of a <cc_card> for POSTing to
// cc_cud.php. The exact `cc_cud.php` request shape is still TBD (open
// question #1 in architecture.md) — this module produces the inner XML
// only; the request envelope is up to the caller.

// Schema 1.1 adds `conventions` and `leads` maps alongside `fields` so
// the C_/L_ element families (checkboxes and lead-card preferences) round-
// trip losslessly. 1.0 exports — if any exist in the wild — silently lose
// those families; we never shipped 1.0, so we don't bother to migrate.
export const SCHEMA_VERSION = '1.1'
export const SOURCE_ID = 'bbo-acbl'

/**
 * Build the portable JSON envelope from one or more parsed cards.
 *
 * @param {object[]} cards - Output of parseCardFetch(), one per card.
 * @param {object} [opts]
 * @param {string} [opts.exportedAt] - Override timestamp (test seam).
 * @returns A JSON-serializable object matching the schema in architecture.md.
 */
export function cardsToJson(cards, { exportedAt } = {}) {
  return {
    schema_version: SCHEMA_VERSION,
    exported_at: exportedAt ?? new Date().toISOString(),
    source: SOURCE_ID,
    cards: cards.map(cardToJson),
  }
}

function cardToJson(card) {
  return {
    cc_key: card.cc_key,
    title: card.title,
    partner: card.partner ?? '',
    owner: card.owner,
    stock: !!card.stock,
    default: !!card.default,
    style: card.style,
    fields: { ...(card.fields ?? {}) },
    conventions: { ...(card.conventions ?? {}) },
    leads: { ...(card.leads ?? {}) },
  }
}

/**
 * Rebuild BBO's inner `<cc>` XML string.
 *
 * Output shape:
 *   `<cc filler="..."><E_name t="..."/>...<C_name c="y"/>...<L_name l="y"/>...</cc>`
 *
 * Group order matches what `cc_fetch.php`/`cc_cud.php` emit: text fields
 * first, then convention flags, then lead preferences. Within each group,
 * insertion order is preserved.
 *
 * Values are XML-attribute-escaped (& < > " '). Names are NOT escaped —
 * they're identifiers — but anything with characters that would break an
 * XML name (whitespace, angle brackets, etc.) is dropped to avoid emitting
 * malformed XML.
 */
export function buildInnerCcXml(payload = {}, { filler = DEFAULT_FILLER } = {}) {
  const { fields = {}, conventions = {}, leads = {} } = payload

  // Field names may start with a digit (e.g., `1NTMin1`) because the
  // family prefix (E_/C_/L_) is what makes the final XML element name valid.
  const isValidName = (name) => /^[\w.-]+$/.test(name)

  const renderGroup = (obj, prefix, attr) =>
    Object.entries(obj)
      .filter(([name]) => isValidName(name))
      .map(
        ([name, value]) =>
          `<${prefix}${name} ${attr}="${escapeXmlAttr(value ?? '')}"/>`
      )
      .join('')

  const body =
    renderGroup(fields, 'E_', 't') +
    renderGroup(conventions, 'C_', 'c') +
    renderGroup(leads, 'L_', 'l')

  return `<cc filler="${escapeXmlAttr(filler)}">${body}</cc>`
}

/**
 * Encode a string for use inside an XML/HTML attribute value. Used both by
 * buildInnerCcXml (escaping E_ field values) and by buildOuterCcCardXml
 * (escaping the inner XML when nesting it into the `cc=` attribute).
 */
export function escapeXmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Wrap a card's inner XML in the outer `<cc_card>` element that BBO's
 * import endpoint expects. The inner XML gets HTML-entity encoded into
 * the `cc=` attribute (same shape we see coming back from cc_fetch.php).
 *
 * The exact set of attributes cc_cud.php requires has not been confirmed —
 * this is a best-effort reconstruction matching cc_fetch.php's response.
 * Adjust once the import request format is sniffed (architecture.md open
 * question #1).
 */
export function buildOuterCcCardXml(card, { filler } = {}) {
  const innerXml = buildInnerCcXml(
    {
      fields: card.fields ?? {},
      conventions: card.conventions ?? {},
      leads: card.leads ?? {},
    },
    { filler }
  )
  const attrs = {
    cc_key: card.cc_key ?? '',
    stock: card.stock ? 'y' : 'N',
    style: card.style ?? 'ACBL',
    owner: card.owner ?? '',
    title: card.title ?? '',
    default: card.default ? 'y' : 'n',
    cc: innerXml,
  }
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeXmlAttr(v)}"`)
    .join(' ')
  return `<cc_card ${attrString}/>`
}

// Filler string used in the `<cc filler="...">` attribute. BBO's editor
// emits 4× the lowercase alphabet (~200 chars) — we match that length to
// be conservative. The content is cosmetic padding; the server does not
// appear to inspect it.
const DEFAULT_FILLER = 'abcdefghijklmnopqrstuvwxyz'.repeat(4)

/**
 * Build the URL-encoded form body for a POST to cc_cud.php, as BBO's own Save
 * does (acblCC.js).
 *
 * `cmd=replace` overwrites the card identified by `cc_key`. `cmd=insert`
 * creates a new card, and BBO hands back its key. The auth pair (user/password)
 * is the lobby session token, not the BBO password — same as
 * readAuthFromLocation() returns.
 *
 * BBO stores title and partner as they arrive and writes them straight into
 * XML attributes, so its Save escapes them first. So do we.
 *
 * Returns a URLSearchParams instance so the caller can stringify it or
 * feed it directly to fetch().
 */
export function buildCcCudBody(cmd, card, auth) {
  const innerXml = buildInnerCcXml({
    fields: card.fields ?? {},
    conventions: card.conventions ?? {},
    leads: card.leads ?? {},
  })
  const body = new URLSearchParams({
    cmd,
    user: auth.user,
    password: auth.token,
    partner: escapeXmlAttr(card.partner ?? ''),
    default: card.default ? 'y' : 'n',
    title: escapeXmlAttr(card.title ?? ''),
    style: card.style ?? 'ACBL',
    cc: innerXml,
    request_id: '0',
    v3u: 'BBO1',
  })
  if (cmd !== 'insert') body.set('cc_key', card.cc_key)
  return body
}

export function buildCcCudReplaceBody(card, auth) {
  return buildCcCudBody('replace', card, auth)
}
