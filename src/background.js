// Service worker entry point.
//
// Currently a placeholder. Will gain message handlers for cross-frame
// coordination (e.g., dispatching list-side actions from the editor) and
// possibly download orchestration for export features.

import browser from 'webextension-polyfill'

browser.runtime.onInstalled.addListener(() => {
  // eslint-disable-next-line no-console
  console.log('[better-bbo-cc] installed')
})
