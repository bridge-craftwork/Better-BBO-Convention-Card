import { describe, it, expect, vi } from 'vitest'
import { planImport, planWrites, countDifferences, newerCopy } from '../../src/lib/import-plan.js'
import { stampSaveBody } from '../../src/lib/save-stamp.js'

const ME = 'rick'
const item = (over) => ({ cc_key: 'K', title: 'BMW', owner: ME, partner: 'art', stock: false, default: true, ...over })
const card = (over) => ({ cc_key: 'K', title: 'BMW', owner: ME, style: 'ACBL', fields: { names: 'A' }, conventions: {}, leads: {}, ...over })
const live = (fields = { names: 'A' }) => vi.fn(async () => card({ fields }))

describe('planImport', () => {
  it('skips a card whose settings are already on BBO, ignoring blanks', async () => {
    const [entry] = await planImport([card({ fields: { names: 'A', approach: '' } })], [item()], ME, live())
    expect(entry.action).toBe('same')
  })

  it('asks when one of your cards differs, by key', async () => {
    const [entry] = await planImport([card({ title: 'Old name' })], [item()], ME, live({ names: 'B', approach: 'x' }))
    expect(entry).toMatchObject({ action: 'ask', differences: 2, bothTitle: 'BMW (imported)' })
    expect(entry.target.cc_key).toBe('K')
  })

  it('asks when one of your cards has the title but another key', async () => {
    const [entry] = await planImport([card({ cc_key: 'GONE' })], [item()], ME, live({ names: 'B' }))
    expect(entry.action).toBe('ask')
  })

  it('adds a card that matches nothing, without fetching', async () => {
    const fetchCard = live()
    const [entry] = await planImport([card({ cc_key: 'GONE', title: 'New' })], [item()], ME, fetchCard)
    expect(entry).toMatchObject({ action: 'add', title: 'New' })
    expect(fetchCard).not.toHaveBeenCalled()
  })

  it('matches a title once per file: a second card of that title is new', async () => {
    const plan = await planImport(
      [card({ cc_key: 'A' }), card({ cc_key: 'B' })], [item()], ME, live({ names: 'B' })
    )
    expect(plan.map((e) => e.action)).toEqual(['ask', 'add'])
    expect(plan[1].title).toBe('BMW 2')
  })

  it("makes a private copy of a changed card someone else owns, never asking to replace theirs", async () => {
    const [entry] = await planImport([card()], [item({ owner: 'art' })], ME, live({ names: 'B' }))
    expect(entry).toMatchObject({ action: 'copy', title: 'BMW (private)' })
  })

  it('makes a private copy of a stock card, and of a file from another owner', async () => {
    const stock = await planImport([card()], [item({ owner: 'bbo', stock: true })], ME, live({ names: 'B' }))
    expect(stock[0].action).toBe('copy')
    const other = await planImport([card({ cc_key: 'GONE', owner: 'art', title: 'Theirs' })], [], ME, live())
    expect(other[0]).toMatchObject({ action: 'copy', title: 'Theirs (private)' })
  })

  it('skips a shared card that is unchanged', async () => {
    const [entry] = await planImport([card()], [item({ owner: 'art' })], ME, live())
    expect(entry.action).toBe('same')
  })

  it('asks about your existing private copy on a second import', async () => {
    const list = [item({ owner: 'art' }), item({ cc_key: 'P', title: 'BMW (private)', partner: '' })]
    const fetchCard = vi.fn(async () => card({ fields: { names: 'B' } }))
    const [entry] = await planImport([card()], list, ME, fetchCard)
    expect(entry).toMatchObject({ action: 'ask', bothTitle: 'BMW (private) (imported)' })
    expect(entry.target.cc_key).toBe('P')
  })

  it('treats usernames as case-insensitive', async () => {
    const [entry] = await planImport([card()], [item({ owner: 'RICK' })], ME, live({ names: 'B' }))
    expect(entry.action).toBe('ask')
  })

  it('skips other card styles and anything not a BBO card', async () => {
    const plan = await planImport([card({ style: 'V2BASIC' }), { title: 'x' }], [item()], ME, live())
    expect(plan.map((e) => e.action)).toEqual(['skip', 'skip'])
  })
})

describe('planWrites', () => {
  const target = item()

  it('replaces keeping the title, partner and favourite on BBO', () => {
    const [w] = planWrites([{ card: card({ title: 'Old', partner: '', default: false }), action: 'ask', target, choice: 'replace' }])
    expect(w.cmd).toBe('replace')
    expect(w.card).toMatchObject({ cc_key: 'K', title: 'BMW', partner: 'art', default: true })
  })

  it('makes new cards private and never the favourite', () => {
    const c = card({ partner: 'art', default: true })
    const writes = planWrites([
      { card: c, action: 'add', title: 'A' },
      { card: c, action: 'copy', title: 'B' },
      { card: c, action: 'ask', target, choice: 'both', bothTitle: 'C' },
    ])
    expect(writes.map((w) => [w.cmd, w.card.title, w.card.partner, w.card.default])).toEqual([
      ['insert', 'A', '', false], ['insert', 'B', '', false], ['insert', 'C', '', false],
    ])
  })

  it('writes nothing for keep, same or skip', () => {
    expect(planWrites([
      { card: card(), action: 'ask', target, choice: 'keep' },
      { card: card(), action: 'same', target },
      { card: card(), action: 'skip', reason: 'x' },
    ])).toEqual([])
  })
})

describe('countDifferences', () => {
  it('counts changed and one-sided settings across families', () => {
    expect(countDifferences(
      { fields: { a: '1', b: '2' }, conventions: { c: 'y' } },
      { fields: { a: '9' }, leads: { d: 'y' } }
    )).toBe(4)
  })
})

describe('saved dates', () => {
  const dated = (seconds, approach = 'x') => ({ title: 'A', fields: { approach, ...(seconds ? { bbccSaved: String(seconds) } : {}) } })
  const OCT = Date.UTC(2026, 9, 1) / 1000
  const NOV = Date.UTC(2026, 10, 1) / 1000

  it('says which copy is newer', () => {
    expect(newerCopy(dated(NOV), dated(OCT))).toBe('file')
    expect(newerCopy(dated(OCT), dated(NOV))).toBe('bbo')
  })

  it('can’t say with no date on BBO, or the same date', () => {
    expect(newerCopy(dated(NOV), dated(null))).toBeNull()
    expect(newerCopy(dated(NOV), dated(NOV))).toBeNull()
  })

  it('takes a file with no date as no newer than its export', () => {
    expect(newerCopy(dated(null), dated(NOV), '2026-10-15T00:00:00Z')).toBe('bbo')
    expect(newerCopy(dated(null), dated(OCT), '2026-10-15T00:00:00Z')).toBeNull()
    expect(newerCopy(dated(null), dated(NOV))).toBeNull()
  })

  it('doesn’t count the date as a difference', () => {
    expect(countDifferences(dated(OCT), dated(NOV))).toBe(0)
    expect(countDifferences(dated(null), dated(NOV))).toBe(0)
  })

  it('dates a new card, and keeps the date a card came with', () => {
    const writes = planWrites(
      [
        { card: dated(null), action: 'add', title: 'A' },
        { card: dated(OCT), action: 'add', title: 'B' },
      ],
      NOV
    )
    expect(writes.map((w) => w.card.fields.bbccSaved)).toEqual([String(NOV), String(OCT)])
  })
})

describe('stampSaveBody', () => {
  const body = (cmd, cc = "<cc filler='abc'><E_x t=\"a%26amp%3Bb\"/></cc>", style = 'ACBL') =>
    `cmd=${cmd}&user=u&password=p&partner=&default=n&title=T&style=${style}&cc=${cc}&request_id=1`

  it('adds the date to a card’s contents', () => {
    expect(stampSaveBody(body('replace'), 123)).toContain('<E_x t="a%26amp%3Bb"/><E_bbccSaved t="123"/></cc>&request_id=1')
    expect(stampSaveBody(body('insert'), 123)).toContain('<E_bbccSaved t="123"/></cc>')
  })

  it('handles an empty card', () => {
    expect(stampSaveBody(body('insert', "<cc filler='abc'/>"), 123)).toContain(`&cc=<cc filler='abc'><E_bbccSaved t="123"/></cc>&request_id=1`)
  })

  it('leaves everything else alone', () => {
    for (const other of [body('copy'), body('link'), body('delete'), body('replace', undefined, 'V2BASIC'), null, undefined]) {
      expect(stampSaveBody(other, 123)).toBe(other)
    }
  })
})
