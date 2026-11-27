import { describe, it, expect } from 'vitest'
import { normalizePdfOptions, rememberAnswers, PDF_DEFAULTS } from '../../src/lib/pdf-options.js'

describe('normalizePdfOptions', () => {
  it('gives the defaults for nothing saved: Classic, card only, green, flat', () => {
    expect(normalizePdfOptions(undefined)).toEqual(PDF_DEFAULTS)
    expect(PDF_DEFAULTS).toEqual({ template: 'classic', printTemplate: 'classic', secondPage: 'none', green: true, fillable: false })
  })

  it('keeps known answers and replaces unknown ones', () => {
    expect(normalizePdfOptions({ template: 'new', printTemplate: 'page', secondPage: 'notes', green: false, fillable: true })).toEqual({
      template: 'new',
      printTemplate: 'page',
      secondPage: 'notes',
      green: false,
      fillable: true,
    })
    expect(normalizePdfOptions({ template: 'page', printTemplate: 'wbf', secondPage: 'x', green: 'no', fillable: 'yes' })).toEqual({
      ...PDF_DEFAULTS,
      green: true,
    })
  })
})

describe('rememberAnswers', () => {
  const answer = { template: 'new', secondPage: 'acbl', green: false, fillable: true }

  it('Export PDF remembers the card, second page, ink and fillable', () => {
    expect(rememberAnswers(PDF_DEFAULTS, 'export', answer)).toEqual({ ...answer, printTemplate: 'classic' })
  })

  it("Print remembers its own card choice, and leaves Export's card and fillable alone", () => {
    expect(rememberAnswers(PDF_DEFAULTS, 'print', { ...answer, template: 'page' })).toEqual({
      template: 'classic',
      printTemplate: 'page',
      secondPage: 'acbl',
      green: false,
      fillable: false,
    })
  })
})
