import { describe, it, expect } from 'vitest'
import {
  decodeXParam,
  readAuthFromLocation,
  buildEditorUrl,
  cardPageParams,
} from '../../src/lib/auth.js'

describe('decodeXParam', () => {
  it('decodes the canonical example from the architecture doc', () => {
    // 'kemistry|7616999834159742236|'
    const hex = '6b656d69737472797c373631363939393833343135393734323233367c'
    expect(decodeXParam(hex)).toEqual({
      user: 'kemistry',
      token: '7616999834159742236',
    })
  })

  it('rejects non-hex input', () => {
    expect(decodeXParam('zzzz')).toBeNull()
  })

  it('rejects odd-length input', () => {
    expect(decodeXParam('abc')).toBeNull()
  })

  it('rejects empty input', () => {
    expect(decodeXParam('')).toBeNull()
    expect(decodeXParam(null)).toBeNull()
  })

  it('rejects decoded strings that do not match user|token| shape', () => {
    // 'no pipes here' hex-encoded
    const hex = Buffer.from('no pipes here', 'ascii').toString('hex')
    expect(decodeXParam(hex)).toBeNull()
  })
})

describe('readAuthFromLocation', () => {
  it('reads from x= param', () => {
    const url = 'https://example.com/?x=6b656d69737472797c373631363939393833343135393734323233367c&mobile=y'
    expect(readAuthFromLocation(url)).toEqual({
      user: 'kemistry',
      token: '7616999834159742236',
    })
  })

  it('falls back to u=/p= form', () => {
    const url = 'https://example.com/?u=alice&p=secret'
    expect(readAuthFromLocation(url)).toEqual({
      user: 'alice',
      token: 'secret',
    })
  })

  it('returns null when neither form is present', () => {
    expect(readAuthFromLocation('https://example.com/?mobile=y')).toBeNull()
  })
})

describe('buildEditorUrl', () => {
  it('builds an ACBL editor URL with key and partner', () => {
    const url = buildEditorUrl({
      style: 'ACBL',
      cc_key: 'ACBL/N/kemistry/abc/1',
      partner: 'aam135',
      edit: true,
    })
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      'https://webutil.bridgebase.com/v2/acblcc/acblCC.html'
    )
    expect(parsed.searchParams.get('edit')).toBe('y')
    expect(parsed.searchParams.get('key')).toBe('ACBL/N/kemistry/abc/1')
    expect(parsed.searchParams.get('partner')).toBe('aam135')
  })

  it('defaults edit to "n" and partner to empty', () => {
    const url = buildEditorUrl({ style: 'ACBL', cc_key: 'k' })
    const parsed = new URL(url)
    expect(parsed.searchParams.get('edit')).toBe('n')
    expect(parsed.searchParams.get('partner')).toBe('')
  })

  it('routes V1BASIC to cs_render_cc.php with cckey param', () => {
    const url = buildEditorUrl({ style: 'V1BASIC', cc_key: 'k' })
    expect(url).toBe(
      'https://webutil.bridgebase.com/v2/cs_render_cc.php?cckey=k'
    )
  })

  it('routes V2BASIC to v2cc.html', () => {
    const url = buildEditorUrl({ style: 'V2BASIC', cc_key: 'k' })
    expect(url.startsWith(
      'https://webutil.bridgebase.com/v2/v2cc/v2cc.html'
    )).toBe(true)
  })

  it('routes CC to renderFD.html', () => {
    const url = buildEditorUrl({ style: 'CC', cc_key: 'k' })
    expect(url.startsWith(
      'https://webutil.bridgebase.com/v2/fdcc/renderFD.html'
    )).toBe(true)
  })

  it('throws on unknown style', () => {
    expect(() => buildEditorUrl({ style: 'NOPE', cc_key: 'k' })).toThrow()
  })
})

describe('cardPageParams', () => {
  const hex = (text) => Buffer.from(text).toString('hex')
  const key = 'ACBL/N/kemistry/1663877063_3407_geminiman/1663876845'

  it('reads a key hex-encoded in x, as BBO’s list opens a card', () => {
    const x = hex(`edit=n&key=${encodeURIComponent(key)}&partner=wino%20john&mobile=y`)
    const params = cardPageParams(`?x=${x}&referer=abc`)
    expect(params.get('key')).toBe(key)
    expect(params.get('partner')).toBe('wino john')
  })

  it('reads a key from the URL itself', () => {
    expect(cardPageParams(`?key=${encodeURIComponent(key)}`).get('key')).toBe(key)
    expect(cardPageParams(`?cckey=abc`).get('cckey')).toBe('abc')
  })

  it('has no key when x holds only the session', () => {
    expect(cardPageParams(`?x=${hex('kemistry|123|')}`).get('key')).toBeNull()
  })
})
