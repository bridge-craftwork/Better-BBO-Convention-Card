// The card in a URL fragment, as convention-card's js/handoff.js writes it
// (`v1.` + base64url of the deflate-raw JSON), for Edit on Bridge Craftwork and
// Save to Bridge Classroom. The library compresses with CompressionStream,
// which in Safari's content scripts refuses the bytes ("Invalid type should be
// ArrayBuffer"); fflate does the same deflate in plain JavaScript, everywhere.

import { deflateSync } from 'fflate'
import { upgradeCardData } from '@bridge-craftwork/convention-card/js/migrate.js'
import { toSchema3 } from '@bridge-craftwork/convention-card/js/schema3.js'

const PREFIX = 'v1.'

function toBase64Url(bytes) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A card record ({ name, description, card_data }) as a URL-safe string. */
export function encodeCardForUrl({ name = null, description = null, card_data }) {
  const json = JSON.stringify({ name, description, card_data: toSchema3(upgradeCardData(card_data || {})) })
  return PREFIX + toBase64Url(deflateSync(new TextEncoder().encode(json), { level: 9 }))
}
