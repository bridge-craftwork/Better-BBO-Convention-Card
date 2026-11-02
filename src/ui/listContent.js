// Content script for the BBO convention-card LIST view.
// Runs on https://webutil.bridgebase.com/v2/acblCCFM/* — the iframe BBO's
// lobby embeds in Account → Convention cards.
//
// Adds:
//   - "↗" open-in-tab button on each card row
//   - Top toolbar with "Export my cards as JSON" and "Import from JSON or PDF"
//     (the rules for cards already on BBO are in ../lib/import-plan.js)
//
// Per-row card metadata lives in jQuery `$(row).data('cc_data')` in the
// page's JS context. Content scripts run in an isolated world and cannot
// read jQuery data directly. The companion MAIN-world content script
// `listPageWorld.js` (registered separately in manifest.json) handles
// mirroring `cc_data` onto a `data-bbcc-card` dataset attribute, which
// this script then reads via getAttribute(). The split is required
// because BBO's iframe has a CSP `script-src 'self'` that forbids us
// from inlining a <script> tag into the document ourselves.

import { parseCardList, parseCardFetch, parseSaveStatus, exportAllKeys } from '../parsers/cc-xml.js'
import { cardsToJson, buildCcCudBody } from '../parsers/cc-json.js'
import { planImport, planWrites, savedAt } from '../lib/import-plan.js'
import { readImportFile } from '../lib/card-output.js'
import { askAboutCard } from './import-dialog.js'
import { ENDPOINTS } from '../lib/auth.js'
import { readAuthFromLocation } from '../lib/auth.js'
import { openCardInTab } from './open-in-tab.js'

const LOG_PREFIX = '[better-bbo-cc/list]'

const TOOLBAR_ID = 'better-bbo-cc-list-toolbar'
const OPEN_BUTTON_CLASS = 'better-bbo-cc-open-btn'
const ROW_DATA_ATTR = 'data-bbcc-card'
const STYLE_ID = 'better-bbo-cc-list-styles'

main()

function main() {
  installStyles()
  ensureToolbar()
  decorateExistingRows()
  observeListMutations()
  installOpenButtonCaptureGuard()
  // eslint-disable-next-line no-console
  console.log(LOG_PREFIX, 'initialized')
}

/**
 * Intercept clicks on our ↗ button in capture phase, before any
 * bubble-phase handler can fire. The row anchor (`a.card-item`) has
 * Bootstrap's `data-toggle="modal"` attribute, which triggers a
 * delegated bubble-phase click handler on `document` that opens the
 * card's action modal. Calling stopPropagation on the inner button's
 * click isn't enough — Bootstrap is already wired up before we render,
 * and capture-phase is the only ordering guarantee.
 */
function installOpenButtonCaptureGuard() {
  document.addEventListener(
    'click',
    (ev) => {
      const btn = ev.target.closest?.(`.${OPEN_BUTTON_CLASS}`)
      if (!btn) return
      ev.preventDefault()
      ev.stopPropagation()
      ev.stopImmediatePropagation()
      const row = btn.closest('a.card-item')
      if (!row) return
      const card = readRowCardData(row)
      if (!card) {
        // eslint-disable-next-line no-console
        console.warn(LOG_PREFIX, 'no cc_data yet on row', row)
        return
      }
      openCardInTab({
        style: card.type,
        cc_key: card.cc_key,
        partner: card.partner ?? '',
        edit: false,
      })
    },
    true // capture
  )
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${TOOLBAR_ID} {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      background: #f4f4f4;
      border-bottom: 1px solid #ccc;
      font: 13px/1.4 system-ui, sans-serif;
    }
    #${TOOLBAR_ID} button {
      cursor: pointer;
      padding: 4px 10px;
      border: 1px solid #888;
      background: #fff;
      border-radius: 3px;
    }
    #${TOOLBAR_ID} button:disabled {
      opacity: 0.5;
      cursor: progress;
    }
    a.card-item { position: relative; }
    .${OPEN_BUTTON_CLASS} {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      padding: 2px 8px;
      border: 1px solid #888;
      background: #fff;
      color: #333;
      text-decoration: none;
      border-radius: 3px;
      font: 14px/1.4 system-ui, sans-serif;
      cursor: pointer;
      z-index: 2;
    }
    .${OPEN_BUTTON_CLASS}:hover { background: #eef; }
  `
  document.head.appendChild(style)
}

function ensureToolbar() {
  if (document.getElementById(TOOLBAR_ID)) return

  const toolbar = document.createElement('div')
  toolbar.id = TOOLBAR_ID

  const label = document.createElement('span')
  label.textContent = 'Better BBO CC:'
  label.style.alignSelf = 'center'
  label.style.fontWeight = 'bold'
  toolbar.appendChild(label)

  const exportAll = document.createElement('button')
  exportAll.type = 'button'
  exportAll.textContent = 'Export my cards as JSON'
  exportAll.title =
    'Download your own cards and cards shared with you. Stock cards are left out: export one from its own page.'
  exportAll.addEventListener('click', () => handleExportAll(exportAll))
  toolbar.appendChild(exportAll)

  const importBtn = document.createElement('button')
  importBtn.type = 'button'
  importBtn.textContent = 'Import from JSON or PDF'
  importBtn.title =
    'Add cards from a previously-exported JSON file or an ACBL card PDF. You are asked before a card of yours is replaced; a card you don\'t own becomes a private copy.'
  importBtn.addEventListener('click', () => handleImport(importBtn))
  toolbar.appendChild(importBtn)

  document.body.insertBefore(toolbar, document.body.firstChild)
}

function decorateExistingRows() {
  document.querySelectorAll('a.card-item').forEach(decorateRow)
}

function observeListMutations() {
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue
        if (node.matches?.('a.card-item')) decorateRow(node)
        node.querySelectorAll?.('a.card-item').forEach(decorateRow)
      }
    }
  })
  obs.observe(document.body, { childList: true, subtree: true })
}

function decorateRow(row) {
  if (row.querySelector(`.${OPEN_BUTTON_CLASS}`)) return

  // <span> instead of <a>: nesting an <a> inside `a.card-item` is invalid
  // HTML and triggers some browsers' parser-correction. A span styled like
  // a button avoids the issue. The click is handled centrally by
  // installOpenButtonCaptureGuard() to dodge Bootstrap's modal trigger.
  const btn = document.createElement('span')
  btn.className = OPEN_BUTTON_CLASS
  btn.textContent = '↗'
  btn.title = 'Open this card in a new tab'
  btn.setAttribute('role', 'button')
  row.appendChild(btn)
}

function readRowCardData(row) {
  const raw = row.getAttribute(ROW_DATA_ATTR)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

async function handleExportAll(button) {
  const auth = readAuthFromLocation()
  if (!auth) {
    alert('Could not read BBO auth from this page. Try reopening Account → Convention cards in the BBO lobby.')
    return
  }
  button.disabled = true
  const originalLabel = button.textContent
  button.textContent = 'Exporting…'

  try {
    const listXml = await postForm(ENDPOINTS.list, {
      user: auth.user,
      password: auth.token,
    })
    const listItems = parseCardList(listXml)

    const uniqueKeys = exportAllKeys(listItems)
    if (uniqueKeys.length === 0) {
      alert('You have no cards of your own to export. To export a stock card, open it and use Export JSON.')
      return
    }

    const cards = []
    let done = 0
    for (const cc_key of uniqueKeys) {
      const xml = await postForm(ENDPOINTS.fetch, {
        key: cc_key,
        request_id: String(Date.now()),
        v3u: 'BBO1',
      })
      // The fetch carries no partner; the list does.
      const partner = listItems.find((i) => i.cc_key === cc_key && i.partner)?.partner
      cards.push({ ...parseCardFetch(xml), partner: partner ?? '' })
      done += 1
      button.textContent = `Exporting… (${done}/${uniqueKeys.length})`
    }

    const envelope = cardsToJson(cards)
    downloadJson(envelope, `bbo-cards-${auth.user}-${todayString()}.json`)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(LOG_PREFIX, 'export failed', err)
    alert(`Export failed: ${err.message}`)
  } finally {
    button.disabled = false
    button.textContent = originalLabel
  }
}

async function handleImport(button) {
  const auth = readAuthFromLocation()
  if (!auth) {
    alert('Could not read BBO auth from this page. Try reopening Account → Convention cards in the BBO lobby.')
    return
  }

  const file = await pickImportFile()
  if (!file) return

  let envelope
  try {
    envelope = await readImportFile(file)
  } catch (err) {
    alert(`Could not read ${file.name}: ${err.message}`)
    return
  }

  const cards = Array.isArray(envelope?.cards) ? envelope.cards : null
  if (!cards || cards.length === 0) {
    alert('This file holds no cards.')
    return
  }

  button.disabled = true
  const originalLabel = button.textContent
  button.textContent = 'Checking…'

  let changed = 0
  try {
    const listXml = await postForm(ENDPOINTS.list, {
      user: auth.user,
      password: auth.token,
    })
    const fetchCard = async (cc_key) =>
      parseCardFetch(
        await postForm(ENDPOINTS.fetch, {
          key: cc_key,
          request_id: String(Date.now()),
          v3u: 'BBO1',
        })
      )
    const plan = await planImport(cards, parseCardList(listXml), auth.user, fetchCard, {
      exportedAt: envelope.exported_at,
    })

    for (const entry of plan) {
      if (entry.action !== 'ask') continue
      entry.choice = await askAboutCard({
        title: entry.target.title,
        importedTitle: entry.card.title,
        exportedAt: envelope.exported_at,
        fileSaved: savedAt(entry.card),
        bboSaved: entry.bboSaved,
        newer: entry.newer,
        differences: entry.differences,
        bothTitle: entry.bothTitle,
      })
    }

    const writes = planWrites(plan)
    if (writes.length > 0 && !window.confirm(`${[describePlan(plan, writes), ...envelope.notes].join('\n\n')}\n\nSave these to your BBO account?`)) {
      return
    }

    const failures = []
    for (const [index, { cmd, card }] of writes.entries()) {
      button.textContent = `Importing… (${index + 1}/${writes.length})`
      try {
        parseSaveStatus(await postBody(ENDPOINTS.cud, buildCcCudBody(cmd, card, auth).toString()))
        changed += 1
      } catch (err) {
        failures.push(`${card.title || card.cc_key}: ${err.message}`)
      }
    }
    alert(
      `Import complete.\n\n${describePlan(plan, writes)}` +
        (failures.length > 0 ? `\n\nFailed:\n- ${failures.join('\n- ')}` : '')
    )
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(LOG_PREFIX, 'import failed', err)
    alert(`Import failed: ${err.message}`)
  } finally {
    button.disabled = false
    button.textContent = originalLabel
  }
  // The list on this page doesn't know about the new cards until it reloads.
  if (changed > 0) window.location.reload()
}

function describePlan(plan, writes) {
  const count = (action) => plan.filter((e) => e.action === action).length
  const kept = plan.filter((e) => e.choice === 'keep').length
  const lines = [
    [writes.filter((w) => w.cmd === 'replace').length, 'replaced with the file\'s copy'],
    [count('add') + plan.filter((e) => e.choice === 'both').length, 'added as new cards'],
    [count('copy'), 'added as private copies of cards you don\'t own'],
    [count('same'), 'already the same on BBO'],
    [kept, 'kept as they are on BBO'],
  ]
    .filter(([n]) => n > 0)
    .map(([n, what]) => `${n} ${what}`)
  const skipped = plan.filter((e) => e.action === 'skip')
  if (skipped.length > 0) {
    lines.push(`${skipped.length} skipped: ${[...new Set(skipped.map((e) => e.reason))].join('; ')}`)
  }
  return lines.join('\n')
}

function pickImportFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json,application/pdf,.pdf'
    input.addEventListener('change', () => {
      resolve(input.files?.[0] ?? null)
    })
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

async function postForm(url, fields) {
  return postBody(url, new URLSearchParams(fields).toString())
}

async function postBody(url, body) {
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

function todayString() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}
