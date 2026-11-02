// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { decodeCardFromUrl } from '@bridge-craftwork/convention-card/js/handoff.js'
import { PDFDocument, PDFName } from 'pdf-lib'
import { setAssetLoader, TEMPLATE_FILES, FONT_FILE } from '@bridge-craftwork/convention-card/js/assets.js'
import { renderAcblPdfBytes } from '@bridge-craftwork/convention-card/js/acblClassicFillPdf.js'
import {
  recordFromFetch,
  cardEditorUrl,
  bridgeClassroomUrl,
  cardFromPdf,
  readImportFile,
} from '../../src/lib/card-output.js'

const here = dirname(fileURLToPath(import.meta.url))
const xml = readFileSync(resolve(here, '../fixtures/cc_fetch_sample.xml'), 'utf-8')
const asset = (path) => readFileSync(resolve(here, '../../node_modules/@bridge-craftwork/convention-card/assets', path))

beforeAll(() => {
  globalThis.DOMParser = new JSDOM('').window.DOMParser
  setAssetLoader({
    template: (name) => new Uint8Array(asset(`templates/${TEMPLATE_FILES[name]}`)),
    font: () => new Uint8Array(asset(`fonts/${FONT_FILE}`)),
  })
})

describe('recordFromFetch', () => {
  it('converts an ACBL card, keeping its name and partners', async () => {
    const record = await recordFromFetch(xml)
    expect(record.name).toBe('BMW')
    expect(record.card_data.metadata.partner_names).toBe('Rick and Art')
  })

  it('refuses other card styles', async () => {
    await expect(recordFromFetch(xml.replace('style="ACBL"', 'style="V2BASIC"'))).rejects.toThrow(/V2BASIC/)
  })
})

describe('links', () => {
  it('carries the card in the editor link’s fragment', async () => {
    const record = await recordFromFetch(xml)
    const url = await cardEditorUrl(record)
    const [base, data] = url.split('#import=')
    expect(base).toBe('https://bridge-craftwork.com/card/')
    expect((await decodeCardFromUrl(data)).name).toBe('BMW')
  })

  it('carries the card in the Bridge Classroom link’s fragment', async () => {
    const record = await recordFromFetch(xml)
    const url = await bridgeClassroomUrl(record)
    const [base, data] = url.split('#/convention-card?import=')
    expect(base).toBe('https://bridge-classroom.com/solo-practice-app/')
    expect((await decodeCardFromUrl(data)).card_data.metadata.partner_names).toBe('Rick and Art')
  })
})

describe('import from PDF', () => {
  const pdfFile = (bytes) => ({ arrayBuffer: async () => bytes.slice().buffer })

  it.each(['classic', 'new'])('reads back a card from our %s PDF, keeping its key and settings', async (template) => {
    const bytes = await renderAcblPdfBytes(await recordFromFetch(xml), template)
    const { cards, notes } = await readImportFile(pdfFile(bytes))
    expect(cards).toHaveLength(1)
    expect(cards[0].title).toBe('BMW')
    expect(cards[0].cc_key).toBe('ACBL/N/kemistry/1399129902_4125_aam135/1399129902')
    expect(cards[0].fields.names).toBe('Rick and Art')
    expect(notes).toEqual([])
  })

  it('warns about a PDF with no card inside, read from its boxes', async () => {
    const bytes = await renderAcblPdfBytes(await recordFromFetch(xml), 'classic')
    const doc = await PDFDocument.load(bytes)
    doc.getInfoDict().delete(PDFName.of('BridgeClassroomCard'))
    const { card, notes } = await cardFromPdf(await doc.save())
    expect(card.fields.names).toBe('Rick and Art')
    expect(notes.join(' ')).toMatch(/read from the PDF's boxes/)
  })

  it('rejects a PDF that holds no card', async () => {
    const doc = await PDFDocument.create()
    doc.addPage()
    await expect(cardFromPdf(await doc.save())).rejects.toThrow(/no card/)
  })

  it('still reads our JSON', async () => {
    const json = new TextEncoder().encode(JSON.stringify({ exported_at: 'x', cards: [{ title: 'A' }] }))
    expect(await readImportFile(pdfFile(json))).toEqual({ exported_at: 'x', cards: [{ title: 'A' }], notes: [] })
  })
})
