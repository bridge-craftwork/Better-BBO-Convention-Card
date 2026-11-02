// Service worker entry point.
//
// Opens hand-off links for the editor toolbar: a tab opened from here isn't
// stopped by a popup blocker, as window.open can be once the card has been
// fetched, or inside BBO's iframe.

import browser from 'webextension-polyfill'

const OPENABLE = ['https://bridge-craftwork.com/card/', 'https://bridge-classroom.com/solo-practice-app/']

browser.runtime.onInstalled.addListener(() => {
  // eslint-disable-next-line no-console
  console.log('[better-bbo-cc] installed')
})

browser.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'open-card-link') return undefined
  if (!OPENABLE.some((base) => String(message.url).startsWith(`${base}#`))) {
    return Promise.reject(new Error('Not a card link'))
  }
  return browser.tabs.create({ url: message.url }).then(() => true)
})
