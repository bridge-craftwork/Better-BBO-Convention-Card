import { describe, it, expect, vi } from 'vitest'
import { planImport, planWrites, countDifferences } from '../../src/lib/import-plan.js'

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
