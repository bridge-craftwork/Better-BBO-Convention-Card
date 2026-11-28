// The questions Print and Export PDF ask before a PDF is made, laid out as the
// bridge-craftwork.com editor's PDF dialog lays them out: which card, what goes
// on the second page, green or black entries, and (Export only) fillable. The
// answers are remembered in the extension's storage on this device.
//
// The dialog lives in a shadow root, so BBO's stylesheets neither reach it nor
// are touched by it. Card names come from BBO, so everything goes in as text.

import browser from 'webextension-polyfill'
import { TEMPLATES, PAGE_TEMPLATE, SECOND_PAGES, normalizePdfOptions, rememberAnswers } from '../lib/pdf-options.js'

const KEY = 'pdfOptions'

async function loadPdfOptions() {
  try {
    const stored = await browser.storage.local.get(KEY)
    return normalizePdfOptions(stored?.[KEY])
  } catch {
    return normalizePdfOptions(null)
  }
}

async function savePdfOptions(options) {
  try {
    await browser.storage.local.set({ [KEY]: options })
  } catch {
    /* the defaults stand next time */
  }
}

const ACTIONS = {
  print: { title: 'Print', go: 'Print' },
  export: { title: 'Export PDF', go: 'Download' },
}

const CSS = `
  dialog { border: none; border-radius: 12px; padding: 20px 22px; width: min(500px, calc(100vw - 40px));
    box-sizing: border-box; box-shadow: 0 12px 40px rgba(0,0,0,.2); color: #1a1a1a;
    font: 14px/1.4 system-ui, -apple-system, sans-serif; }
  dialog::backdrop { background: rgba(17,24,39,.35); }
  .title { font-weight: 600; font-size: 16px; margin: 0 0 14px; }
  fieldset { border: none; margin: 0 0 14px; padding: 0; }
  legend, .legend { display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; padding: 0; }
  .hint { font-weight: 400; color: #6b7280; }
  .template { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 1px solid #e0ddd7;
    border-radius: 8px; margin-bottom: 6px; cursor: pointer; }
  .template.chosen { border-color: #40916c; background: #f6faf7; }
  .template input, .check input { margin: 3px 0 0; }
  .name { display: block; font-weight: 600; }
  .desc { display: block; font-size: 12px; color: #6b7280; margin-top: 2px; }
  .second { display: block; margin: 0 0 14px; }
  select { font: inherit; font-size: 13px; padding: 5px 8px; width: 100%; box-sizing: border-box; }
  .notes { display: block; font-size: 12px; color: #6b7280; margin-top: 4px; }
  .notes.some { color: #2d6a4f; }
  .check { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; margin: 0 0 14px; }
  .off { opacity: .45; pointer-events: none; }
  .buttons { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  button { font: inherit; font-size: 14px; padding: 8px 14px; border-radius: 6px; border: 1px solid #d1d5db;
    background: #fff; color: #1a1a1a; cursor: pointer; }
  button.go { background: #2d6a4f; border-color: #2d6a4f; color: #fff; font-weight: 600; }
`

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v
    else node[k] = v
  }
  node.append(...children)
  return node
}

/**
 * Ask how to make the PDF. `allowPage` adds Print's "this page" choice. `cardName` may be a promise, and `hasNotes` is a promise of whether the card has
 * anything for a notes page (or null to say nothing). Resolves with
 * { template, secondPage, green, fillable }, or null when cancelled.
 */
export async function askPdfOptions({ action = 'export', allowPage = false, cardName = '', hasNotes = null } = {}) {
  const saved = await loadPdfOptions()
  const withPage = action === 'print' && allowPage
  const templates = withPage ? [...TEMPLATES, PAGE_TEMPLATE] : TEMPLATES
  // "This page" is remembered from the card page; where there is no page, Classic.
  const remembered = action === 'print' ? saved.printTemplate : saved.template
  const chosenTemplate = templates.some((t) => t.id === remembered) ? remembered : TEMPLATES[0].id

  const host = el('div')
  const root = host.attachShadow({ mode: 'open' })
  const dialog = el('dialog')
  root.append(el('style', { textContent: CSS }), dialog)

  const title = el('p', { class: 'title', textContent: ACTIONS[action].title })
  dialog.append(title)
  Promise.resolve(cardName)
    .then((name) => {
      if (name) title.textContent = `${ACTIONS[action].title}: ${name}`
    })
    .catch(() => {})

  const fieldset = el('fieldset', {}, el('legend', { textContent: 'Card' }))
  const radios = templates.map((t) => {
    const input = el('input', { type: 'radio', name: 'template', value: t.id, checked: t.id === chosenTemplate })
    const label = el('label', { class: 'template' }, input, el('span', {}, el('span', { class: 'name', textContent: t.name }), el('span', { class: 'desc', textContent: t.desc })))
    fieldset.append(label)
    return { input, label }
  })
  dialog.append(fieldset)

  const select = el('select')
  for (const p of SECOND_PAGES) select.append(el('option', { value: p.id, textContent: p.name, selected: p.id === saved.secondPage }))
  const notes = el('span', { class: 'notes' })
  const second = el('label', { class: 'second' }, el('span', { class: 'legend' }, 'Second page ', el('span', { class: 'hint', textContent: '(for printing on both sides)' })), select, notes)
  dialog.append(second)
  Promise.resolve(hasNotes)
    .then((some) => {
      if (some == null) return
      notes.textContent = some ? 'This card has notes for a notes page.' : 'This card has no notes yet: a notes page would be empty.'
      notes.classList.toggle('some', some)
    })
    .catch(() => {})

  const green = el('input', { type: 'checkbox', checked: saved.green })
  const greenRow = el('label', { class: 'check' }, green, el('span', {}, 'What the card says in green', el('span', { class: 'desc', textContent: "As BBO's card shows it: your entries stand out from the printed form. Untick for black." })))
  dialog.append(greenRow)

  const fillable = el('input', { type: 'checkbox', checked: saved.fillable })
  if (action === 'export') {
    dialog.append(el('label', { class: 'check' }, fillable, el('span', {}, 'Fillable, to edit in a PDF app', el('span', { class: 'desc', textContent: 'Edit it in Acrobat or Chrome. On a Mac, Preview and Safari show its boxes in a plain font, and shrink long entries.' }))))
  }

  const cancel = el('button', { type: 'button', textContent: 'Cancel' })
  const go = el('button', { type: 'button', class: 'go', textContent: ACTIONS[action].go })
  dialog.append(el('div', { class: 'buttons' }, cancel, go))

  // The page itself has no second page or ink to choose.
  const refresh = () => {
    for (const { input, label } of radios) label.classList.toggle('chosen', input.checked)
    const page = radios.find((r) => r.input.checked)?.input.value === PAGE_TEMPLATE.id
    second.classList.toggle('off', page)
    greenRow.classList.toggle('off', page)
  }
  for (const { input } of radios) input.addEventListener('change', refresh)
  refresh()

  document.body.append(host)
  dialog.showModal()
  go.focus()

  return new Promise((resolve) => {
    let answer = null
    cancel.addEventListener('click', () => dialog.close())
    go.addEventListener('click', () => {
      answer = {
        template: radios.find((r) => r.input.checked)?.input.value ?? chosenTemplate,
        secondPage: select.value,
        green: green.checked,
        fillable: action === 'export' && fillable.checked,
      }
      // Resolve inside the click, so a caller can still open a tab (Safari's print).
      resolve(answer)
      dialog.close()
      savePdfOptions(rememberAnswers(saved, action, answer))
    })
    dialog.addEventListener('close', () => {
      host.remove()
      if (!answer) resolve(null)
    })
  })
}
