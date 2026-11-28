import { describe, it, expect } from 'vitest'
import { sortRows, nextSort, normalizeSort } from '../../src/lib/list-sort.js'

const rows = [
  { title: 'Your Favorite', partner: '', favorite: true, order: 0 },
  { title: 'BMW', partner: '', favorite: false, order: 1 },
  { title: 'Sam and Rick', partner: '', favorite: false, order: 2 },
  { title: 'Art and Rick', partner: 'aam135', favorite: false, order: 3 },
  { title: 'blakely/ Wilson', partner: 'BBlak', favorite: false, order: 4 },
  { title: 'BMW', partner: 'ajer95', favorite: false, order: 5 },
]
const titles = (sorted) => sorted.map((r) => `${r.title}|${r.partner}`)

describe('sortRows', () => {
  it("keeps BBO's order with no sort", () => {
    expect(sortRows(rows, null).map((r) => r.order)).toEqual([0, 1, 2, 3, 4, 5])
  })
  it('sorts by title, ignoring case, favourite first, ties in BBO order', () => {
    expect(titles(sortRows(rows, { key: 'title', dir: 'asc' }))).toEqual([
      'Your Favorite|', 'Art and Rick|aam135', 'blakely/ Wilson|BBlak', 'BMW|', 'BMW|ajer95', 'Sam and Rick|',
    ])
  })
  it('reverses by title, favourite still first', () => {
    expect(titles(sortRows(rows, { key: 'title', dir: 'desc' }))[0]).toBe('Your Favorite|')
    expect(titles(sortRows(rows, { key: 'title', dir: 'desc' }))[1]).toBe('Sam and Rick|')
  })
  it('sorts by partner, cards without one last either way', () => {
    expect(titles(sortRows(rows, { key: 'partner', dir: 'asc' }))).toEqual([
      'Your Favorite|', 'Art and Rick|aam135', 'BMW|ajer95', 'blakely/ Wilson|BBlak', 'BMW|', 'Sam and Rick|',
    ])
    expect(titles(sortRows(rows, { key: 'partner', dir: 'desc' })).slice(1, 4)).toEqual([
      'blakely/ Wilson|BBlak', 'BMW|ajer95', 'Art and Rick|aam135',
    ])
  })
})

describe('nextSort', () => {
  it("cycles ascending, descending, then BBO's order", () => {
    expect(nextSort(null, 'title')).toEqual({ key: 'title', dir: 'asc' })
    expect(nextSort({ key: 'title', dir: 'asc' }, 'title')).toEqual({ key: 'title', dir: 'desc' })
    expect(nextSort({ key: 'title', dir: 'desc' }, 'title')).toBeNull()
    expect(nextSort({ key: 'title', dir: 'desc' }, 'partner')).toEqual({ key: 'partner', dir: 'asc' })
  })
  it('ignores a bad saved sort', () => {
    expect(normalizeSort({ key: 'x', dir: 'asc' })).toBeNull()
    expect(normalizeSort('title')).toBeNull()
  })
})
