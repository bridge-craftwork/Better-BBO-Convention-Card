// The choices a PDF asks for, as the bridge-craftwork.com editor asks them
// (convention-card's web/src/editor/pdfActions.js): which ACBL card, what
// goes on the second page, green or black entries, and, for a PDF to keep,
// whether it is fillable. Print can also print the page itself, as BBO shows
// it (print-fix.js). The dialog (ui/pdf-dialog.js) keeps the last answers in
// the extension's own storage on this device; without it the defaults stand.

export const TEMPLATES = [
  { id: 'classic', name: 'ACBL Classic', desc: 'The familiar SS1 Rev. 4-12 card: what most clubs use.' },
  { id: 'new', name: 'ACBL New', desc: 'The redesigned ACBL card.' },
]

/** Print's extra choice: this page, with the print fix. */
export const PAGE_TEMPLATE = {
  id: 'page',
  name: 'This page, as BBO shows it',
  desc: "BBO's own layout, fitted to one landscape page.",
}

// The library's SECOND_PAGES, named for people
export const SECOND_PAGES = [
  { id: 'none', name: 'Nothing: the card only' },
  { id: 'notes', name: "Notes: the card's notes and supplementary pages" },
  { id: 'acbl', name: 'ACBL scoresheet' },
]

export const PDF_DEFAULTS = { template: 'classic', printTemplate: 'classic', secondPage: 'none', green: true, fillable: false }

/** Saved answers made safe: anything unknown or missing takes its default. */
export function normalizePdfOptions(saved) {
  const s = saved && typeof saved === 'object' ? saved : {}
  const isTemplate = (id) => TEMPLATES.some((t) => t.id === id)
  return {
    template: isTemplate(s.template) ? s.template : PDF_DEFAULTS.template,
    printTemplate: isTemplate(s.printTemplate) || s.printTemplate === PAGE_TEMPLATE.id ? s.printTemplate : PDF_DEFAULTS.printTemplate,
    secondPage: SECOND_PAGES.some((p) => p.id === s.secondPage) ? s.secondPage : PDF_DEFAULTS.secondPage,
    green: s.green !== false,
    fillable: s.fillable === true,
  }
}

/** The answers one dialog gives, folded into what is remembered. Print never changes `fillable`. */
export function rememberAnswers(saved, action, { template, secondPage, green, fillable }) {
  const next = { ...normalizePdfOptions(saved), secondPage, green }
  if (action === 'print') next.printTemplate = template
  else Object.assign(next, { template, fillable })
  return normalizePdfOptions(next)
}
