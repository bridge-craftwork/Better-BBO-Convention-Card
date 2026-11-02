// The ACBL PDFs, from the convention-card library. The templates and the font
// ship with the extension; crxjs lists them as web-accessible for this script.

import browser from 'webextension-polyfill'
import { setAssetLoader } from '@bridge-craftwork/convention-card/js/assets.js'
import { downloadAcblPdf } from '@bridge-craftwork/convention-card/js/acblClassicFillPdf.js'
import classicUrl from '@bridge-craftwork/convention-card/assets/templates/acbl-classic-2023.pdf?url'
import newUrl from '@bridge-craftwork/convention-card/assets/templates/acbl-new.pdf?url'
import fontUrl from '@bridge-craftwork/convention-card/assets/fonts/BarlowCondensed-Regular.ttf?url'

async function load(url) {
  const res = await fetch(browser.runtime.getURL(url.replace(/^\//, '')))
  if (!res.ok) throw new Error(`Could not load ${url}: HTTP ${res.status}`)
  return res.arrayBuffer()
}

setAssetLoader({
  template: (name) => load(name === 'new' ? newUrl : classicUrl),
  font: () => load(fontUrl),
})

export { downloadAcblPdf }
