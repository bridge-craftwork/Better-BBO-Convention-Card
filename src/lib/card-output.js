// A BBO card to the convention-card library's form, and from there to the ACBL
// PDFs or a link that opens it in another app. Everything is imported on first
// use: the renderer is a couple of megabytes, and most page views never ask.

import { parseCardFetch } from '../parsers/cc-xml.js'

export const TEMPLATES = { classic: 'Classic', new: 'New' }

// The fragment of these links never reaches a server (the library's DECISIONS.md, 20).
export const CARD_EDITOR = 'https://bridge-craftwork.com/card/'

/** The library's record for a cc_fetch.php response. Only ACBL cards map to it. */
export async function recordFromFetch(xml) {
  const card = parseCardFetch(xml)
  if ((card.style ?? 'ACBL') !== 'ACBL') {
    throw new Error(`This is a ${card.style} card; only ACBL cards can be converted.`)
  }
  const { importBboJson } = await import('@bridge-craftwork/convention-card/js/bbo.js')
  return importBboJson({ cards: [card] })
}

/** The URL that opens `record` in the card editor at bridge-craftwork.com. */
export async function cardEditorUrl(record) {
  const { encodeCardForUrl } = await import('@bridge-craftwork/convention-card/js/handoff.js')
  return `${CARD_EDITOR}#import=${await encodeCardForUrl(record)}`
}

/** The URL that hands `record` to Bridge Classroom, which saves it once signed in. */
export async function bridgeClassroomUrl(record) {
  const lib = await import('@bridge-craftwork/convention-card/web/src/handoffToBridgeClassroom.js')
  return lib.bridgeClassroomUrl(record)
}

const isPdf = (bytes) => String.fromCharCode(...bytes.subarray(0, 4)) === '%PDF'

/** One BBO card from a PDF's bytes, and anything the user should check about it. */
export async function cardFromPdf(bytes) {
  const [{ importCard }, { exportBboCard }] = await Promise.all([
    import('@bridge-craftwork/convention-card/js/importCard.js'),
    import('@bridge-craftwork/convention-card/js/bbo.js'),
  ])
  const read = await importCard(bytes, { from: 'pdf' })
  const notes = []
  if (read.report?.source === 'boxes') {
    notes.push(
      `“${read.name}” was read from the PDF's boxes: suit symbols and some wording can be lost, and BBO may show different boxes ticked. Check the card after importing.`
    )
  }
  if (read.report?.skipped?.length) {
    notes.push(`${read.report.skipped.length} box(es) in the PDF couldn't be read, and were left out.`)
  }
  return { card: exportBboCard(read.card_data, { name: read.name }), notes }
}

/** What an import file holds: `{ cards, exported_at?, notes }`, from our JSON or a PDF. */
export async function readImportFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (isPdf(bytes)) {
    const { card, notes } = await cardFromPdf(bytes)
    return { cards: [card], notes }
  }
  return { ...JSON.parse(new TextDecoder().decode(bytes)), notes: [] }
}
