import { describe, it, expect } from 'vitest'
import { notifyUrl, buildSavedNoticeBody, partnersToNotify } from '../../src/lib/notify.js'

const auth = { user: 'kemistry', token: '7616999834159742236' }

describe('notifyUrl', () => {
  it("uses the page's universe", () => {
    expect(notifyUrl('https://webutil.bridgebase.com/v2/acblCCFM/acblCCFM_bs.php?x=ab&v3u=BBO1')).toBe(
      'https://webutil.bridgebase.com/v2/www_notify.php?v3u=BBO1'
    )
  })

  it('falls back to bbo1, as BBO does', () => {
    expect(notifyUrl('https://webutil.bridgebase.com/v2/acblCCFM/acblCCFM_bs.php?x=ab')).toBe(
      'https://webutil.bridgebase.com/v2/www_notify.php?v3u=bbo1'
    )
    expect(notifyUrl('not a url')).toBe('https://webutil.bridgebase.com/v2/www_notify.php?v3u=bbo1')
  })
})

describe('buildSavedNoticeBody', () => {
  it("matches BBO's editor: u, p, c=wc_convcard_saved, d=key|partner|style", () => {
    const body = buildSavedNoticeBody({ cc_key: 'K1', partner: 'aam135', style: 'ACBL' }, auth)
    expect(Object.fromEntries(body)).toEqual({
      u: 'kemistry',
      p: '7616999834159742236',
      c: 'wc_convcard_saved',
      d: 'K1|aam135|ACBL',
    })
  })

  it('leaves the partner empty for a card used alone', () => {
    expect(buildSavedNoticeBody({ cc_key: 'K2' }, auth).get('d')).toBe('K2||ACBL')
    expect(buildSavedNoticeBody({ cc_key: 'K2', partner: null, style: null }, auth).get('d')).toBe('K2||ACBL')
  })
})

describe('partnersToNotify', () => {
  const list = [
    { cc_key: 'K1', partner: '' },
    { cc_key: 'K1', partner: 'aam135' },
    { cc_key: 'K1', partner: 'aam135' },
    { cc_key: 'K2', partner: 'other' },
  ]

  it('names every partner the card is listed with, once each', () => {
    expect(partnersToNotify('K1', list)).toEqual(['', 'aam135'])
  })

  it("falls back to the saved card's partner for a card not in the list, such as a new one", () => {
    expect(partnersToNotify('NEW', list)).toEqual([''])
    expect(partnersToNotify('NEW', list, 'pard')).toEqual(['pard'])
  })
})
