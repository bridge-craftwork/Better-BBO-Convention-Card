import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  parseCardList,
  parseCardFetch,
  parseInnerCcXml,
  exportAllKeys,
  parseSaveStatus,
} from '../../src/parsers/cc-xml.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) =>
  readFileSync(resolve(here, '../fixtures', name), 'utf-8')

describe('exportAllKeys', () => {
  it('leaves out stock cards', () => {
    expect(exportAllKeys(parseCardList(fixture('cc_list_sample.xml')))).toEqual([
      'ACBL/N/kemistry/1399129902_4125_aam135/1399129902',
      'V2BASIC/N/kemistry/9999_basic_solo/1',
    ])
  })

  it('keeps cards shared by someone else, once per card', () => {
    const shared = { cc_key: 'ACBL/N/aam135/1/1', owner: 'aam135', stock: false }
    expect(exportAllKeys([shared, { ...shared }])).toEqual(['ACBL/N/aam135/1/1'])
  })

  it('is empty when every card is stock', () => {
    expect(exportAllKeys([{ cc_key: 'ACBL/y/bbo/SAYC/1', stock: true }])).toEqual([])
  })
})

describe('parseCardList', () => {
  const xml = fixture('cc_list_sample.xml')

  it('returns one entry per <cc_listitem>', () => {
    const items = parseCardList(xml)
    expect(items).toHaveLength(3)
  })

  it('parses attributes verbatim and converts y/N flags', () => {
    const items = parseCardList(xml)
    expect(items[0]).toEqual({
      self: 'kemistry',
      cc_key: 'ACBL/N/kemistry/1399129902_4125_aam135/1399129902',
      stock: false,
      style: 'ACBL',
      owner: 'kemistry',
      title: 'BMW',
      default: false,
      partner: 'aam135',
    })
  })

  it('treats stock="y" as true', () => {
    const items = parseCardList(xml)
    expect(items[1].stock).toBe(true)
    expect(items[1].owner).toBe('bbo')
  })

  it('treats default="Y" as true', () => {
    const items = parseCardList(xml)
    expect(items[2].default).toBe(true)
    expect(items[2].partner).toBe('')
  })

  it('throws on non-zero err', () => {
    expect(() =>
      parseCardList('<cc_list err="1"></cc_list>')
    ).toThrow(/err=1/)
  })

  it('throws when root element is wrong', () => {
    expect(() => parseCardList('<other/>')).toThrow(/Expected <cc_list>/)
  })

  it('throws on malformed XML', () => {
    expect(() => parseCardList('<unclosed>')).toThrow()
  })
})

describe('parseCardFetch', () => {
  const xml = fixture('cc_fetch_sample.xml')

  it('extracts top-level card metadata', () => {
    const card = parseCardFetch(xml)
    expect(card.cc_key).toBe(
      'ACBL/N/kemistry/1399129902_4125_aam135/1399129902'
    )
    expect(card.title).toBe('BMW')
    expect(card.owner).toBe('kemistry')
    expect(card.style).toBe('ACBL')
    expect(card.stock).toBe(false)
    expect(card.default).toBe(false)
  })

  it('decodes the entity-encoded inner XML into a flat fields map', () => {
    const card = parseCardFetch(xml)
    expect(card.fields).toEqual({
      names: 'Rick and Art',
      approach: '2/1 Game forcing',
      majorOther1: 'Bergen Raises',
      major3NTMin: '13',
      major3NTMax: '15',
      '1NTMin1': '15',
      '1NTMax1': '17',
      slamOther1: 'RKC 1430 & specific kings',
    })
  })

  it('extracts C_ convention flags into a separate map', () => {
    const card = parseCardFetch(xml)
    expect(card.conventions).toEqual({
      'major12-5': 'y',
      '2CStrong': 'y',
      '1NStayman': 'y',
    })
  })

  it('extracts L_ lead preferences into a separate map', () => {
    const card = parseCardFetch(xml)
    expect(card.leads).toEqual({
      'ls-xx-x1': 'y',
      'ln-akjx-k': 'y',
    })
  })

  it('throws on non-zero err', () => {
    expect(() =>
      parseCardFetch('<cc_card err="2" cc=""></cc_card>')
    ).toThrow(/err=2/)
  })
})

describe('parseInnerCcXml', () => {
  it('groups elements by family and strips prefixes', () => {
    const xml =
      '<cc filler="x"><E_foo t="bar"/><X_ignored t="nope"/><C_conv c="y"/><L_lead l="y"/><E_baz t="42"/></cc>'
    expect(parseInnerCcXml(xml)).toEqual({
      fields: { foo: 'bar', baz: '42' },
      conventions: { conv: 'y' },
      leads: { lead: 'y' },
    })
  })

  it('returns empty maps for an empty <cc>', () => {
    expect(parseInnerCcXml('<cc filler=""></cc>')).toEqual({
      fields: {},
      conventions: {},
      leads: {},
    })
  })
})

describe('parseSaveStatus', () => {
  it('returns the key of a good save', () => {
    expect(parseSaveStatus('<status err="0" cc_key="K"/>')).toBe('K')
  })

  it('throws on any error, including several digits', () => {
    expect(() => parseSaveStatus('<status err="1"/>')).toThrow(/err=1/)
    expect(() => parseSaveStatus('<status err="10"/>')).toThrow(/err=10/)
  })

  it('throws on a response that is not a status', () => {
    expect(() => parseSaveStatus('<other/>')).toThrow(/Unexpected/)
  })
})

describe('names BBO stores escaped', () => {
  const stored = 'A &amp;amp; B &amp;#43; &amp;lt;C&amp;gt;'

  it('decodes a list item’s title and partner once', () => {
    const [item] = parseCardList(
      `<cc_list err="0"><cc_listitem self="me" cc_key="k" stock="N" style="ACBL" owner="me" title="${stored}" default="N" partner="${stored}"/></cc_list>`
    )
    expect(item.title).toBe('A & B + <C>')
    expect(item.partner).toBe('A & B + <C>')
  })

  it('decodes a fetched card’s title', () => {
    const card = parseCardFetch(
      `<cc_card err="0" cc_key="k" stock="N" style="ACBL" owner="me" title="${stored}" default="n" cc="&lt;cc/&gt;"/>`
    )
    expect(card.title).toBe('A & B + <C>')
  })

  it('leaves a literal entity the user typed', () => {
    const card = parseCardFetch(
      `<cc_card err="0" cc_key="k" stock="N" style="ACBL" owner="me" title="a &amp;amp;amp; b" default="n" cc="&lt;cc/&gt;"/>`
    )
    expect(card.title).toBe('a &amp; b')
  })
})
