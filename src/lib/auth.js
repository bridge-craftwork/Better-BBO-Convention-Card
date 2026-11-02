// Authentication + URL helpers for BBO's convention-card endpoints.
//
// BBO encodes the lobby user's identity into a single URL param `x` on the
// iframe src: hex of `username|sessiontoken|`. The session token is not the
// user's password — it's an ephemeral handle the lobby mints when it builds
// the CC manager iframe. The same (user, token) pair authenticates every
// `webutil.bridgebase.com/v2/` endpoint we care about.

const WEBUTIL_BASE = 'https://webutil.bridgebase.com/v2'

const EDITOR_PATHS = {
  ACBL: `${WEBUTIL_BASE}/acblcc/acblCC.html`,
  V2BASIC: `${WEBUTIL_BASE}/v2cc/v2cc.html`,
  V1BASIC: `${WEBUTIL_BASE}/cs_render_cc.php`,
  CC: `${WEBUTIL_BASE}/fdcc/renderFD.html`,
}

const ENDPOINTS = {
  list: `${WEBUTIL_BASE}/cc_list.php`,
  fetch: `${WEBUTIL_BASE}/cc_fetch.php`,
  cud: `${WEBUTIL_BASE}/cc_cud.php`,
}

/**
 * Decode the `x` URL param. The param is the hex encoding of an ASCII
 * string of the form `username|sessiontoken|`. Returns `{ user, token }`
 * or `null` if the value doesn't match the expected shape.
 *
 * Example: `6b656d69737472797c373631363939393833343135393734323233367c`
 *       → `kemistry|7616999834159742236|`
 *       → { user: 'kemistry', token: '7616999834159742236' }
 */
export function decodeXParam(hex) {
  if (typeof hex !== 'string' || hex.length === 0 || hex.length % 2 !== 0) {
    return null
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null

  let decoded = ''
  for (let i = 0; i < hex.length; i += 2) {
    decoded += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16))
  }

  const parts = decoded.split('|')
  // Expected shape: `user|token|` → ['user', 'token', '']
  if (parts.length !== 3 || parts[0] === '' || parts[1] === '' || parts[2] !== '') {
    return null
  }
  return { user: parts[0], token: parts[1] }
}

/**
 * Read `{ user, token }` from the current page's URL. Supports both forms:
 *   - `?x=<hex>` (the standard lobby-injected form), or
 *   - `?u=<user>&p=<password>` (rare fallback supported by BBO's CC manager).
 * Returns null if neither is present or the value is malformed.
 */
export function readAuthFromLocation(href = window.location.href) {
  const url = new URL(href)
  const x = url.searchParams.get('x')
  if (x) {
    const decoded = decodeXParam(x)
    if (decoded) return decoded
  }
  const u = url.searchParams.get('u')
  const p = url.searchParams.get('p')
  if (u && p) return { user: u, token: p }
  return null
}

/**
 * Read the raw auth param off the current location for pass-through when
 * opening a new top-level tab. The CC editor pages, when loaded outside
 * the lobby iframe, expect the same `x=` (or `u=`/`p=`) param the iframe
 * was originally constructed with. Returns the URLSearchParams chunk
 * (without leading `?` or `&`), or '' if no auth param is present.
 */
export function getAuthQueryChunk(href = window.location.href) {
  const url = new URL(href)
  const x = url.searchParams.get('x')
  if (x) return `x=${encodeURIComponent(x)}`
  const u = url.searchParams.get('u')
  const p = url.searchParams.get('p')
  if (u && p) return `u=${encodeURIComponent(u)}&p=${encodeURIComponent(p)}`
  return ''
}

/**
 * Build the editor URL for a card. `style` matches BBO's `style` attribute
 * from cc_list.php — one of ACBL, V2BASIC, V1BASIC, CC.
 *
 * V1BASIC is view-only and uses a different param name (`cckey`), so its
 * URL ignores `edit` and `partner`.
 */
export function buildEditorUrl({ style, cc_key, partner = '', edit = false }) {
  const base = EDITOR_PATHS[style]
  if (!base) throw new Error(`Unknown card style: ${style}`)

  if (style === 'V1BASIC') {
    const params = new URLSearchParams({ cckey: cc_key })
    return `${base}?${params.toString()}`
  }

  const params = new URLSearchParams({
    edit: edit ? 'y' : 'n',
    key: cc_key,
    partner: partner ?? '',
  })
  return `${base}?${params.toString()}`
}

export { ENDPOINTS, EDITOR_PATHS, WEBUTIL_BASE }
