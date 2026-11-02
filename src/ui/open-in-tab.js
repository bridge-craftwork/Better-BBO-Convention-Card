// Shared helpers for the "Open in new tab" feature on both the list view
// and the editor pages.
//
// The CC editor URLs work outside the BBO lobby iframe as long as the
// auth param (`x=` or `u=`/`p=`) is preserved. Both content scripts read
// that param off their own location and forward it.

import { buildEditorUrl, getAuthQueryChunk } from '../lib/auth.js'

/**
 * Build the absolute URL to open a card in a top-level tab. Carries the
 * current iframe's auth param through so the destination page can talk
 * to webutil endpoints without a fresh BBO login.
 */
export function buildOpenInTabUrl({ style, cc_key, partner, edit }, currentHref = window.location.href) {
  const base = buildEditorUrl({ style, cc_key, partner, edit })
  const auth = getAuthQueryChunk(currentHref)
  if (!auth) return base
  // buildEditorUrl always emits a query string, so we can safely append `&`.
  return `${base}&${auth}`
}

/**
 * Open a card in a new top-level browser tab. Returns the opened Window
 * (or null if the browser blocked it).
 */
export function openCardInTab(card, currentHref = window.location.href) {
  const url = buildOpenInTabUrl(card, currentHref)
  return window.open(url, '_blank', 'noopener')
}
