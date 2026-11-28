// Telling BBO a card has changed, as its own pages do after each save
// (www_notify.php). BBO's editor sends `wc_convcard_saved` after a save, and its
// list sends `wc_convcard_used` after "Use with partner". BBO answers with
// nothing we read; the call is what lets the lobby pick up the new card,
// for the user and for the partner it is used with.
//
// d is `cc_key|partner|style`, the partner empty for a card used alone.

import { WEBUTIL_BASE } from './auth.js'

/** The URL to notify, in the universe the page was opened in (BBO's `v3u`, default bbo1). */
export function notifyUrl(href = globalThis.location?.href) {
  let universe = ''
  try {
    universe = new URL(href).searchParams.get('v3u') ?? ''
  } catch {
    universe = ''
  }
  return `${WEBUTIL_BASE}/www_notify.php?v3u=${encodeURIComponent(universe || 'bbo1')}`
}

/** The form body for one `wc_convcard_saved` notice. */
export function buildSavedNoticeBody({ cc_key, partner = '', style = 'ACBL' }, auth) {
  return new URLSearchParams({
    u: auth.user,
    p: auth.token,
    c: 'wc_convcard_saved',
    d: `${cc_key}|${partner ?? ''}|${style ?? 'ACBL'}`,
  })
}

/**
 * The partners to notify about a save of `cc_key`: every partner BBO lists the
 * card with, since one card can be used with several and the save changes it
 * for all of them, or else the partner the card was saved with ('' alone).
 */
export function partnersToNotify(cc_key, listItems, savedPartner = '') {
  const listed = listItems.filter((item) => item.cc_key === cc_key).map((item) => item.partner ?? '')
  return [...new Set(listed.length > 0 ? listed : [savedPartner ?? ''])]
}
