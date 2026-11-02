// Content script for the BBO convention-card EDITOR/VIEWER pages.
// Runs on the various editor URLs:
//   - acblcc/acblCC.html       — ACBL-style cards (the most common)
//   - v2cc/v2cc.html           — BBO's V2 BASIC cards
//   - cs_render_cc.php          — V1 BASIC HTML render (view only)
//   - fdcc/renderFD.html       — Flexible CC
//
// Features:
//   - Inject print-friendly @media print CSS (landscape, fit-to-page).
//   - Add an "↗ Open in full tab" button (most useful when this page is
//     loaded inside BBO's lobby iframe; harmless when already top-level).
//   - Add an "Export this card as JSON" button that re-fetches the card
//     via cc_fetch.php and downloads it in our portable schema.
//   - Add buttons for the ACBL PDFs (Classic and New), and to open the card in
//     the bridge-craftwork.com editor or save it to Bridge Classroom.

import browser from 'webextension-polyfill'
import { applyPrintFix } from './print-fix.js'
import { parseCardFetch } from '../parsers/cc-xml.js'
import { cardsToJson } from '../parsers/cc-json.js'
import { ENDPOINTS } from '../lib/auth.js'
import {
  TEMPLATES,
  recordFromFetch,
  cardEditorUrl,
  bridgeClassroomUrl,
} from '../lib/card-output.js'

const LOG_PREFIX = '[better-bbo-cc/editor]'

const TOOLBAR_ID = 'better-bbo-cc-editor-toolbar'
const STYLE_ID = 'better-bbo-cc-editor-styles'

main()

function main() {
  applyPrintFix()
  installStyles()
  injectToolbar()
  // eslint-disable-next-line no-console
  console.log(LOG_PREFIX, 'initialized')
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${TOOLBAR_ID} {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 99999;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 6px 8px;
      background: rgba(255,255,255,0.95);
      border: 1px solid #888;
      border-radius: 4px;
      font: 12px/1.4 system-ui, sans-serif;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
    #${TOOLBAR_ID} button {
      cursor: pointer;
      padding: 3px 8px;
      border: 1px solid #888;
      background: #fff;
      border-radius: 3px;
      font: inherit;
    }
    #${TOOLBAR_ID} button:hover { background: #eef; }
    #${TOOLBAR_ID} button:disabled { opacity: 0.5; cursor: progress; }
    @media print {
      #${TOOLBAR_ID} { display: none !important; }
    }
  `
  document.head.appendChild(style)
}

function injectToolbar() {
  if (document.getElementById(TOOLBAR_ID)) return

  const bar = document.createElement('div')
  bar.id = TOOLBAR_ID

  const label = document.createElement('span')
  label.textContent = 'Better CC:'
  label.style.alignSelf = 'center'
  label.style.fontWeight = 'bold'
  bar.appendChild(label)

  // "Open in full tab" — only meaningful when we're inside an iframe;
  // when top-level, hide the button.
  if (window.top !== window.self) {
    const openBtn = document.createElement('button')
    openBtn.type = 'button'
    openBtn.textContent = '↗ Open in tab'
    openBtn.title = 'Open this card in a new full-size browser tab'
    openBtn.addEventListener('click', () => {
      window.open(window.location.href, '_blank', 'noopener')
    })
    bar.appendChild(openBtn)
  }

  const exportBtn = document.createElement('button')
  exportBtn.type = 'button'
  exportBtn.textContent = 'Export JSON'
  exportBtn.title = 'Download this card as portable JSON'
  exportBtn.addEventListener('click', () => handleExport(exportBtn))
  bar.appendChild(exportBtn)

  const printBtn = document.createElement('button')
  printBtn.type = 'button'
  printBtn.textContent = 'Print (fixed)'
  printBtn.title = 'Print this card using the landscape fit-to-page layout'
  printBtn.addEventListener('click', () => window.print())
  bar.appendChild(printBtn)

  for (const [template, name] of Object.entries(TEMPLATES)) {
    addCardButton(bar, `PDF: ${name}`, `Download the last saved version as the ACBL ${name} card`, 'Rendering…', async (record) => {
      const { downloadAcblPdf } = await import('../lib/card-pdf.js')
      await downloadAcblPdf(record, template)
    })
  }

  addCardButton(bar, 'Edit on Bridge Craftwork', 'Open the last saved version in the card editor at bridge-craftwork.com', 'Opening…', (record) =>
    openLink(cardEditorUrl(record))
  )
  addCardButton(bar, 'Save to Bridge Classroom', 'Open the last saved version in Bridge Classroom, which saves it to your account', 'Opening…', (record) =>
    openLink(bridgeClassroomUrl(record))
  )

  document.body.appendChild(bar)
}

function addCardButton(bar, label, title, busy, action) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.title = title
  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = busy
    try {
      const { xml } = await fetchThisCard()
      await action(await recordFromFetch(xml))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(LOG_PREFIX, label, err)
      alert(`${label} failed: ${err.message}`)
    } finally {
      button.disabled = false
      button.textContent = label
    }
  })
  bar.appendChild(button)
}

async function openLink(url) {
  await browser.runtime.sendMessage({ type: 'open-card-link', url: await url })
}

async function fetchThisCard() {
  const params = new URLSearchParams(window.location.search)
  const cc_key = params.get('key') ?? params.get('cckey')
  if (!cc_key) throw new Error('Could not find this card’s key in the URL.')
  const xml = await postForm(ENDPOINTS.fetch, {
    key: cc_key,
    request_id: String(Date.now()),
    v3u: 'BBO1',
  })
  return { xml, params }
}

async function handleExport(button) {
  button.disabled = true
  const original = button.textContent
  button.textContent = 'Exporting…'

  try {
    const { xml, params } = await fetchThisCard()
    const card = parseCardFetch(xml)
    // partner isn't in the fetch response — pull from URL if present.
    card.partner = params.get('partner') ?? ''
    const envelope = cardsToJson([card])
    const filename = safeFilename(card.title || 'card') + '.json'
    downloadJson(envelope, filename)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(LOG_PREFIX, 'export failed', err)
    alert(`Export failed: ${err.message}`)
  } finally {
    button.disabled = false
    button.textContent = original
  }
}

async function postForm(url, fields) {
  const body = new URLSearchParams(fields).toString()
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`POST ${url} → HTTP ${res.status}`)
  return res.text()
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function safeFilename(s) {
  return s.replace(/[^\w.-]+/g, '_').slice(0, 60) || 'card'
}
