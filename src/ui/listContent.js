// Content script for the BBO convention-card LIST view.
// Runs on https://webutil.bridgebase.com/v2/acblCCFM/* — the iframe BBO's
// lobby embeds in Account → Convention cards.
//
// Adds:
//   - Print, Save PDF and View icons on each card row (as Bridge Classroom's
//     card table has); View opens the card in a new tab
//   - "Import from PDF or JSON" and "Export my cards as JSON", next to BBO's
//     New ACBL Convention Card button
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

import { parseCardList, parseCardFetch, parseSaveStatus, exportAllKeys, nonAcblTitles } from '../parsers/cc-xml.js'
import { cardsToJson, buildCcCudBody } from '../parsers/cc-json.js'
import { planImport, planWrites, savedAt } from '../lib/import-plan.js'
import { readImportFile, recordFromFetch } from '../lib/card-output.js'
import { runPdfAction } from './pdf-flow.js'
import { askAboutCard } from './import-dialog.js'
import { ENDPOINTS } from '../lib/auth.js'
import { readAuthFromLocation } from '../lib/auth.js'
import { openCardInTab } from './open-in-tab.js'
import { notifyUrl, buildSavedNoticeBody, partnersToNotify } from '../lib/notify.js'

const LOG_PREFIX = '[better-bbo-cc/list]'

const TOOLBAR_ID = 'better-bbo-cc-list-toolbar'
const BUTTON_COLUMN_CLASS = 'better-bbo-cc-button-column'
const STANDALONE_CLASS = 'better-bbo-cc-standalone'
const ROW_ACTIONS_CLASS = 'better-bbo-cc-row-actions'
const ROW_BUTTON_CLASS = 'better-bbo-cc-row-btn'

// Lucide's shapes, as the convention-card library's card table draws them
const ROW_ACTIONS = [
  {
    id: 'print',
    pdf: true,
    title: (name) => `Print ${name}`,
    icon: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  },
  {
    id: 'export',
    pdf: true,
    title: (name) => `Save ${name} as a PDF`,
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  },
  {
    id: 'view',
    title: (name) => `View ${name} in a new tab`,
    icon: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  },
]
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
 * Intercept clicks on our row icons in capture phase, before any
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
      const btn = ev.target.closest?.(`.${ROW_BUTTON_CLASS}`)
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
      const action = btn.dataset.action
      if (action === 'view') {
        openCardInTab({ style: card.type, cc_key: card.cc_key, partner: card.partner ?? '', edit: false })
        return
      }
      rowPdf(btn, card, action)
    },
    true // capture
  )
}

// Print or Save PDF from a row, as the card page's Print… and Export PDF… do.
async function rowPdf(btn, card, action) {
  if (btn.getAttribute('aria-busy') === 'true') return
  const label = action === 'print' ? 'Print' : 'Save PDF'
  try {
    await runPdfAction({
      action,
      record: postForm(ENDPOINTS.fetch, { key: card.cc_key, request_id: String(Date.now()), v3u: 'BBO1' }).then(recordFromFetch),
      onBusy: (busy) => btn.setAttribute('aria-busy', String(busy)),
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(LOG_PREFIX, label, err)
    alert(`${label} failed: ${err.message}`)
  }
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    /* BBO's New card column, widened to the row, with our group after it */
    .${BUTTON_COLUMN_CLASS} {
      flex: 1 1 auto;
      max-width: none;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    #${TOOLBAR_ID} { display: inline-flex; flex-wrap: wrap; gap: 8px; }
    #${TOOLBAR_ID} button:disabled { opacity: 0.5; cursor: progress; }
    #${TOOLBAR_ID}.${STANDALONE_CLASS} {
      display: flex;
      padding: 8px 12px;
      background: #f4f4f4;
      border-bottom: 1px solid #ccc;
    }
    a.card-item { position: relative; }
    .${ROW_ACTIONS_CLASS} {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      display: inline-flex;
      gap: 4px;
      z-index: 2;
    }
    .${ROW_BUTTON_CLASS} {
      display: inline-flex;
      align-items: center;
      padding: 5px 6px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #fff;
      color: #6b7280;
      cursor: pointer;
      line-height: 0;
    }
    .${ROW_BUTTON_CLASS}:hover { color: #2d6a4f; border-color: #40916c; }
    .${ROW_BUTTON_CLASS}[aria-busy="true"] { opacity: .5; cursor: progress; }
    /* PDFs are ACBL cards only; until the row's details arrive, View alone. */
    a.card-item:not([${ROW_DATA_ATTR}*='"type":"ACBL"']) .${ROW_BUTTON_CLASS}[data-pdf] { display: none; }
  `
  document.head.appendChild(style)
}

// Our buttons go on BBO's own button row, after New ACBL Convention Card, as
// a group that wraps onto its own line when the panel is too narrow. Without
// that row (BBO changed its page), a bar of their own at the top.
function ensureToolbar() {
  if (document.getElementById(TOOLBAR_ID)) return

  const toolbar = document.createElement('span')
  toolbar.id = TOOLBAR_ID

  const importBtn = document.createElement('button')
  importBtn.type = 'button'
  importBtn.className = 'btn btn-secondary'
  importBtn.textContent = 'Import from PDF or JSON'
  importBtn.title =
    'Better BBO CC: add cards from an ACBL card PDF or an exported JSON file. You are asked before a card of yours is replaced; a card you don\'t own becomes a private copy.'
  importBtn.addEventListener('click', () => handleImport(importBtn))
  toolbar.appendChild(importBtn)

  const exportAll = document.createElement('button')
  exportAll.type = 'button'
  exportAll.className = 'btn btn-secondary'
  exportAll.textContent = 'Export my cards as JSON'
  exportAll.title =
    'Better BBO CC: download your own cards and cards shared with you. Stock cards are left out: export one from its own page.'
  exportAll.addEventListener('click', () => handleExportAll(exportAll))
  toolbar.appendChild(exportAll)

  const newCard = document.getElementById('NewCard')
  const column = newCard?.parentElement
  if (column) {
    column.classList.add(BUTTON_COLUMN_CLASS)
    column.appendChild(toolbar)
  } else {
    toolbar.classList.add(STANDALONE_CLASS)
    document.body.insertBefore(toolbar, document.body.firstChild)
  }
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
  if (row.querySelector(`.${ROW_ACTIONS_CLASS}`)) return
  const name = 'this card'

  // <span>s instead of <button>s or <a>s: nesting interactive content inside
  // `a.card-item` is invalid HTML and triggers some browsers' parser
  // correction. Clicks are handled centrally by installOpenButtonCaptureGuard()
  // to dodge Bootstrap's modal trigger.
  const group = document.createElement('span')
  group.className = ROW_ACTIONS_CLASS
  for (const a of ROW_ACTIONS) {
    const btn = document.createElement('span')
    btn.className = ROW_BUTTON_CLASS
    btn.dataset.action = a.id
    if (a.pdf) btn.dataset.pdf = ''
    btn.title = a.title(name)
    btn.setAttribute('role', 'button')
    btn.setAttribute('aria-label', a.title(name))
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a.icon}</svg>`
    group.appendChild(btn)
  }
  row.appendChild(group)
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
    const leftOut = nonAcblTitles(listItems)
    const leftOutNote = leftOut.length
      ? `Only ACBL cards can be exported. Left out: ${leftOut.map((t) => `“${t}”`).join(', ')}.`
      : ''
    if (uniqueKeys.length === 0) {
      alert(leftOutNote || 'You have no cards of your own to export. To export a stock card, open it and use Export JSON.')
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
    if (leftOutNote) alert(`Exported ${cards.length} card${cards.length === 1 ? '' : 's'}.\n\n${leftOutNote}`)
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
    const listItems = parseCardList(listXml)
    const plan = await planImport(cards, listItems, auth.user, fetchCard, {
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
        const savedKey = parseSaveStatus(await postBody(ENDPOINTS.cud, buildCcCudBody(cmd, card, auth).toString()))
        changed += 1
        await notifySaved({ ...card, cc_key: savedKey || card.cc_key }, listItems, auth)
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
    [kept, 'kept as they are on BBO'],
  ]
    .filter(([n]) => n > 0)
    .map(([n, what]) => `${n} ${what}`)
  for (const e of plan.filter((e) => e.action === 'same')) {
    lines.push(`Identical card “${e.target?.title || e.card.title || 'Untitled'}” exists - not importing`)
  }
  const skipped = plan.filter((e) => e.action === 'skip')
  if (skipped.length > 0) {
    lines.push(`${skipped.length} skipped: ${[...new Set(skipped.map((e) => e.reason))].join('; ')}`)
  }
  return lines.join('\n')
}

// The input goes into the page, hidden, while it's in use: Firefox under
// automation doesn't report a choice made in a detached file input, so the
// live tests couldn't reach the import otherwise. Browsers don't mind either way.
function pickImportFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json,application/pdf,.pdf'
    input.style.display = 'none'
    const finish = (file) => {
      input.remove()
      resolve(file)
    }
    input.addEventListener('change', () => finish(input.files?.[0] ?? null))
    input.addEventListener('cancel', () => finish(null))
    document.body.appendChild(input)
    input.click()
  })
}

/**
 * Tell BBO about a save, as its editor does after each one, so the lobby picks
 * up the new card for the user and each partner it is used with. BBO's own
 * pages don't wait on the answer or report a failure, and nor do we: the card
 * is saved either way.
 */
async function notifySaved(card, listItems, auth) {
  for (const partner of partnersToNotify(card.cc_key, listItems, card.partner)) {
    try {
      await postBody(notifyUrl(), buildSavedNoticeBody({ ...card, partner }, auth).toString())
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(LOG_PREFIX, 'could not tell BBO about the save of', card.cc_key, err)
    }
  }
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
