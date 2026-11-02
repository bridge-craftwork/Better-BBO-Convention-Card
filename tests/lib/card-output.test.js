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
import { exportBboFile, importBboJson } from '@bridge-craftwork/convention-card/js/bbo.js'
import {
  recordFromFetch,
  cardEditorUrl,
  bridgeClassroomUrl,
  cardFromPdf,
  readImportFile,
} from '../../src/lib/card-output.js'
import { countDifferences, planImport, planWrites } from '../../src/lib/import-plan.js'
import { parseCardFetch } from '../../src/parsers/cc-xml.js'

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

  it.each(['classic', 'new'])('reads an unedited %s PDF back as the card, date and all', async (template) => {
    const card = parseCardFetch(xml)
    card.fields.bbccSaved = '1793640000'
    const { card: back } = await cardFromPdf(await renderAcblPdfBytes(importBboJson({ cards: [card] }), template))
    expect(countDifferences(back, card)).toBe(0)
    expect(back.fields.bbccSaved).toBe('1793640000')
  })
})

describe('import from the editor\u2019s BBO file', () => {
  const me = 'kemistry'
  const onBbo = () => {
    const card = parseCardFetch(xml)
    card.fields.bbccSaved = '1793640000'
    return card
  }
  const listItem = () => {
    const { cc_key, title } = onBbo()
    return { cc_key, title, owner: me, partner: 'aam135', stock: false, default: true }
  }
  const importing = async (record) => {
    const json = new TextEncoder().encode(JSON.stringify(exportBboFile(record, '2026-11-02T20:00:00Z')))
    const { cards, exported_at } = await readImportFile(new File([json], 'card.BBO.json'))
    return planImport(cards, [listItem()], me, async () => onBbo(), { exportedAt: exported_at })
  }

  it('finds an unedited card already on BBO', async () => {
    const [entry] = await importing(importBboJson({ cards: [onBbo()] }))
    expect(entry.action).toBe('same')
  })

  it('asks about an edited card, and a replace keeps BBO\u2019s partner', async () => {
    const record = importBboJson({ cards: [onBbo()] })
    record.card_data.notrump.one_nt.range_min = 12
    const [entry] = await importing(record)
    expect(entry).toMatchObject({ action: 'ask', differences: 1 })
    const [write] = planWrites([{ ...entry, choice: 'replace' }], 1800000000)
    expect(write.cmd).toBe('replace')
    expect(write.card).toMatchObject({ cc_key: listItem().cc_key, partner: 'aam135', default: true })
    expect(write.card.fields.bbccSaved).toBe('1800000000')
  })

  it('adds a card made in the editor, which has no key, owner or partner', async () => {
    const [entry] = await importing({ name: 'New', card_data: { notrump: { one_nt: { range_min: 15 } } } })
    expect(entry.card.cc_key).toBeUndefined()
    expect(entry.card.owner).toBeUndefined()
    expect(entry).toMatchObject({ action: 'add', title: 'New' })
    const [write] = planWrites([entry], 1800000000)
    expect(write.cmd).toBe('insert')
    expect(write.card).toMatchObject({ title: 'New', partner: '', default: false })
  })
})
