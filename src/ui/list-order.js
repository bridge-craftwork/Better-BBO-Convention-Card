// BBO's card list, sortable by its Title and Partner headings, with a control
// to hide the Stock Cards. The choices are kept in the extension's storage on
// this device. BBO rebuilds the list after every change, so the sort is put
// back whenever its rows change.

import browser from 'webextension-polyfill'
import { sortRows, nextSort, normalizeSort } from '../lib/list-sort.js'

const KEY = 'listView'
const STYLE_ID = 'better-bbo-cc-list-order-styles'
const LISTS = ['#system-cards', '#personal-cards']
const ROW_DATA_ATTR = 'data-bbcc-card'

let view = { sort: null, hideStock: false }
let nextOrder = 0

export async function installListOrder() {
  const lists = document.getElementById('card-lists')
  if (!lists) return
  try {
    const saved = (await browser.storage.local.get(KEY))?.[KEY]
    view = { sort: normalizeSort(saved?.sort), hideStock: saved?.hideStock === true }
  } catch {
    /* defaults */
  }
  installStyles()
  installHeadings(lists)
  installStockToggle(lists)
  applyAll()
  const observer = new MutationObserver(schedule)
  for (const sel of LISTS) {
    const list = document.querySelector(sel)
    if (list) observer.observe(list, { childList: true })
  }
}

function save() {
  browser.storage.local.set({ [KEY]: view }).catch(() => {})
}

let pending = false
function schedule() {
  if (pending) return
  pending = true
  setTimeout(() => {
    pending = false
    applyAll()
  }, 0)
}

function applyAll() {
  for (const sel of LISTS) {
    const list = document.querySelector(sel)
    if (list) sortList(list)
  }
  refreshHeadings()
  refreshStock()
}

function rowInfo(row) {
  // BBO's own order: the order rows first appear in, as it appends them
  if (!row.dataset.bbccOrder) row.dataset.bbccOrder = String(nextOrder++)
  let favorite = false
  try {
    favorite = JSON.parse(row.getAttribute(ROW_DATA_ATTR) || '{}').favorite === true
  } catch {
    /* not yet */
  }
  const title = row.querySelector('.card-name')?.textContent.trim() ?? ''
  return {
    row,
    title,
    partner: row.querySelector('.partner-name')?.textContent.trim() ?? '',
    favorite: favorite || title === 'Your Favorite Convention Card',
    order: Number(row.dataset.bbccOrder),
  }
}

function sortList(list) {
  const rows = [...list.children].filter((el) => el.matches('a.card-item'))
  const sorted = sortRows(rows.map(rowInfo), view.sort).map((r) => r.row)
  // Only move rows when the order is wrong, so this doesn't feed the observer forever
  if (sorted.every((row, i) => row === rows[i])) return
  for (const row of sorted) list.appendChild(row)
}

// The Title and Partner headings: a click sorts by that column, again reverses
// it, a third time goes back to BBO's order.
function installHeadings(lists) {
  for (const h of lists.querySelectorAll('.column-heading h5')) {
    const key = { title: 'title', partner: 'partner' }[h.textContent.trim().toLowerCase()]
    if (!key || h.dataset.bbccSort) continue
    h.dataset.bbccSort = key
    h.classList.add('bbcc-sortable')
    h.setAttribute('role', 'button')
    h.tabIndex = 0
    h.append(Object.assign(document.createElement('span'), { className: 'bbcc-arrow' }))
    const click = () => {
      view.sort = nextSort(view.sort, key)
      save()
      applyAll()
    }
    h.addEventListener('click', click)
    h.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        click()
      }
    })
  }
}

function refreshHeadings() {
  for (const h of document.querySelectorAll('h5[data-bbcc-sort]')) {
    const on = view.sort?.key === h.dataset.bbccSort
    h.querySelector('.bbcc-arrow').textContent = on ? (view.sort.dir === 'asc' ? ' ▲' : ' ▼') : ''
    h.title = on && view.sort.dir === 'desc' ? "Click for BBO's own order" : `Sort by ${h.dataset.bbccSort}`
  }
}

// "Hide" on the Stock Cards heading folds away its rows and column heading.
function installStockToggle(lists) {
  const heading = [...lists.querySelectorAll('h4.group-heading')].find((h) => /stock/i.test(h.textContent))
  if (!heading || heading.querySelector('.bbcc-stock-toggle')) return
  heading.classList.add('bbcc-stock-heading')
  const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'bbcc-stock-toggle' })
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    view.hideStock = !view.hideStock
    save()
    refreshStock()
  })
  heading.appendChild(btn)
}

function refreshStock() {
  const heading = document.querySelector('.bbcc-stock-heading')
  if (!heading) return
  const columns = heading.nextElementSibling?.matches('.column-heading') ? heading.nextElementSibling : null
  const list = document.querySelector('#system-cards')
  for (const el of [columns, list]) if (el) el.style.display = view.hideStock ? 'none' : ''
  const count = list?.querySelectorAll('a.card-item').length ?? 0
  const btn = heading.querySelector('.bbcc-stock-toggle')
  btn.textContent = view.hideStock ? `Show (${count})` : 'Hide'
  btn.title = view.hideStock ? "Show BBO's stock cards" : "Hide BBO's stock cards"
  btn.setAttribute('aria-expanded', String(!view.hideStock))
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .bbcc-sortable { cursor: pointer; user-select: none; display: inline-block; }
    .bbcc-sortable:hover { text-decoration: underline; }
    .bbcc-arrow { font-size: .8em; }
    .bbcc-stock-heading { position: relative; }
    .bbcc-stock-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      font: 600 14px/1.2 system-ui, sans-serif; padding: 5px 12px;
      border: 1px solid rgba(255,255,255,.7); border-radius: 6px;
      background: transparent; color: inherit; cursor: pointer;
    }
    .bbcc-stock-toggle:hover { background: rgba(255,255,255,.15); }
  `
  document.head.appendChild(style)
}
