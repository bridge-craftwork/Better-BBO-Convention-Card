// Print or Export PDF for one card, as the card page's buttons and the list's
// row icons both do it: ask (pdf-dialog.js), then print or download the ACBL
// card. The card is fetched while the question is open, for the notes hint.

import { askPdfOptions } from './pdf-dialog.js'
import { openPrintTab, printBytes } from './print-pdf.js'

/**
 * `record` is a promise of the library's card record. `allowPage` offers
 * Print's "this page" choice (the card page only); `onBusy(true|false)` is
 * told while the PDF is made. Resolves once printed or downloaded, or
 * cancelled; throws on failure.
 */
export async function runPdfAction({ action, record, allowPage = false, onBusy = () => {} }) {
  record.catch(() => {})
  const pdf = import('../lib/card-pdf.js')
  const options = await askPdfOptions({
    action,
    allowPage,
    cardName: record.then((r) => r.name),
    hasNotes: Promise.all([pdf, record]).then(([lib, r]) => lib.cardHasNotes(r)),
  })
  if (!options) return
  if (options.template === 'page') {
    window.print()
    return
  }
  // In the click still: Safari prints from a tab, which must open now.
  const tab = action === 'print' ? openPrintTab() : null
  onBusy(true)
  try {
    const { downloadAcblPdf, renderAcblPdfBytes } = await pdf
    const settings = { secondPage: options.secondPage, ink: options.green ? 'green' : 'black', flatten: !options.fillable }
    const card = await record
    if (action === 'print') {
      const who = card.card_data?.metadata?.partner_names?.trim() || card.name || 'Convention card'
      const name = `${who} ${options.template === 'new' ? 'ACBL New' : 'ACBL Classic'}`
      printBytes(await renderAcblPdfBytes(card, options.template, settings), tab, name)
    } else {
      await downloadAcblPdf(card, options.template, settings)
    }
  } catch (err) {
    tab?.close()
    throw err
  } finally {
    onBusy(false)
  }
}
