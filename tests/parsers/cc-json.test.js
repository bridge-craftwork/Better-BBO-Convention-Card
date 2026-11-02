import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  cardsToJson,
  buildInnerCcXml,
  buildOuterCcCardXml,
  buildCcCudReplaceBody,
  buildCcCudBody,
  escapeXmlAttr,
  SCHEMA_VERSION,
} from '../../src/parsers/cc-json.js'
import { parseCardFetch, parseInnerCcXml } from '../../src/parsers/cc-xml.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) =>
  readFileSync(resolve(here, '../fixtures', name), 'utf-8')

describe('cardsToJson', () => {
  it('wraps cards in the schema envelope', () => {
    const card = parseCardFetch(fixture('cc_fetch_sample.xml'))
    const env = cardsToJson([card], { exportedAt: '2026-05-28T00:00:00Z' })
    expect(env.schema_version).toBe(SCHEMA_VERSION)
    expect(env.source).toBe('bbo-acbl')
    expect(env.exported_at).toBe('2026-05-28T00:00:00Z')
    expect(env.cards).toHaveLength(1)
    expect(env.cards[0].cc_key).toBe(card.cc_key)
    expect(env.cards[0].fields).toEqual(card.fields)
    expect(env.cards[0].conventions).toEqual(card.conventions)
    expect(env.cards[0].leads).toEqual(card.leads)
  })

  it('defaults exported_at to now when not provided', () => {
    const env = cardsToJson([], {})
    expect(env.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('escapeXmlAttr', () => {
  it('escapes the five XML metacharacters', () => {
    expect(escapeXmlAttr(`a&b<c>d"e'f`)).toBe(
      'a&amp;b&lt;c&gt;d&quot;e&apos;f'
    )
  })

  it('coerces non-strings', () => {
    expect(escapeXmlAttr(42)).toBe('42')
  })
})

describe('buildInnerCcXml', () => {
  it('emits all three element families in group order (E, then C, then L)', () => {
    const xml = buildInnerCcXml(
      {
        fields: { foo: 'bar' },
        conventions: { conv1: 'y' },
        leads: { lead1: 'y' },
      },
      { filler: 'F' }
    )
    expect(xml).toBe(
      '<cc filler="F"><E_foo t="bar"/><C_conv1 c="y"/><L_lead1 l="y"/></cc>'
    )
  })

  it('escapes attribute values', () => {
    const xml = buildInnerCcXml(
      { fields: { x: '<a> & "b"' } },
      { filler: '' }
    )
    expect(xml).toContain('<E_x t="&lt;a&gt; &amp; &quot;b&quot;"/>')
  })

  it('drops entries with characters that would break the XML element name', () => {
    const xml = buildInnerCcXml(
      {
        fields: {
          ok: 'a',
          '1NTMin1': '15',
          'has space': 'b',
          'has<bracket>': 'c',
        },
      },
      { filler: '' }
    )
    expect(xml).toContain('<E_ok t="a"/>')
    expect(xml).toContain('<E_1NTMin1 t="15"/>')
    expect(xml).not.toContain('has space')
    expect(xml).not.toContain('has<bracket>')
  })

  it('round-trips all three groups through parseInnerCcXml', () => {
    const payload = {
      fields: {
        names: 'Rick and Art',
        approach: '2/1 GF',
        // all five XML metacharacters
        tricky: `<&>"'`,
        slamOther1: 'RKC 1430 & specific kings',
      },
      conventions: { 'major12-5': 'y', '2CStrong': 'y' },
      leads: { 'ls-xx-x1': 'y' },
    }
    const xml = buildInnerCcXml(payload)
    expect(parseInnerCcXml(xml)).toEqual(payload)
  })
})

describe('buildCcCudReplaceBody', () => {
  const card = {
    cc_key: 'ACBL/N/kemistry/1/1',
    title: 'BMW',
    partner: 'aam135',
    owner: 'kemistry',
    stock: false,
    default: false,
    style: 'ACBL',
    fields: { names: 'Rick & Art' },
    conventions: { 'major12-5': 'y' },
    leads: {},
  }
  const auth = { user: 'kemistry', token: 'sessiontoken123' }

  it('matches the sniffed BBO Save request shape', () => {
    const body = buildCcCudReplaceBody(card, auth)
    expect(body.get('cmd')).toBe('replace')
    expect(body.get('user')).toBe('kemistry')
    expect(body.get('password')).toBe('sessiontoken123')
    expect(body.get('partner')).toBe('aam135')
    expect(body.get('default')).toBe('n')
    expect(body.get('title')).toBe('BMW')
    expect(body.get('style')).toBe('ACBL')
    expect(body.get('cc_key')).toBe('ACBL/N/kemistry/1/1')
    expect(body.get('v3u')).toBe('BBO1')
    expect(body.get('request_id')).toBe('0')
  })

  it('embeds the inner XML in the cc field', () => {
    const body = buildCcCudReplaceBody(card, auth)
    const cc = body.get('cc')
    expect(cc).toContain('<E_names t="Rick &amp; Art"/>')
    expect(cc).toContain('<C_major12-5 c="y"/>')
  })

  it('flags default cards with y, others n', () => {
    expect(
      buildCcCudReplaceBody({ ...card, default: true }, auth).get('default')
    ).toBe('y')
    expect(
      buildCcCudReplaceBody({ ...card, default: false }, auth).get('default')
    ).toBe('n')
  })
})

describe('buildOuterCcCardXml', () => {
  it('round-trips through parseCardFetch', () => {
    const original = parseCardFetch(fixture('cc_fetch_sample.xml'))
    const rebuilt = buildOuterCcCardXml(original)
    const reparsed = parseCardFetch(rebuilt)
    // partner is dropped on fetch (not in cc_fetch response shape)
    expect(reparsed.cc_key).toBe(original.cc_key)
    expect(reparsed.title).toBe(original.title)
    expect(reparsed.owner).toBe(original.owner)
    expect(reparsed.style).toBe(original.style)
    expect(reparsed.stock).toBe(original.stock)
    expect(reparsed.fields).toEqual(original.fields)
  })
})

describe('buildCcCudBody', () => {
  const auth = { user: 'rick', token: 't' }
  const card = { cc_key: 'K', title: 'A & B', partner: "o'neil", fields: { names: 'x' } }

  it('sends no key on an insert, and a key on a replace', () => {
    expect(buildCcCudBody('insert', card, auth).has('cc_key')).toBe(false)
    expect(buildCcCudBody('replace', card, auth).get('cc_key')).toBe('K')
  })

  it('escapes title and partner, as BBO stores them unescaped into XML', () => {
    const body = buildCcCudBody('insert', card, auth)
    expect(body.get('title')).toBe('A &amp; B')
    expect(body.get('partner')).toBe('o&apos;neil')
  })
})
