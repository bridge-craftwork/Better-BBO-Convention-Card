// MAIN-world content script for the BBO CC list iframe.
//
// Why a separate file: BBO's iframe ships a strict Content-Security-Policy
// (`script-src 'self' …`) that blocks inline <script> we append to the
// document. MV3's `world: "MAIN"` content-script mode sidesteps CSP because
// Chrome itself injects the script, and runs it in the page's JS context
// where jQuery is reachable.
//
// All this script does is copy each card-row's jQuery `cc_data` onto a
// dataset attribute so the isolated-world content script (listContent.js)
// can read it via getAttribute(). Re-runs on every DOM mutation so newly
// added rows are also covered.

const ATTR = 'data-bbcc-card'

function mirror() {
  if (typeof window.jQuery !== 'function') return
  const $ = window.jQuery
  $('a.card-item').each(function () {
    try {
      const data = $(this).data('cc_data')
      if (data) this.setAttribute(ATTR, JSON.stringify(data))
    } catch (e) {
      /* ignore */
    }
  })
}

function start() {
  mirror()
  const obs = new MutationObserver(mirror)
  obs.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
