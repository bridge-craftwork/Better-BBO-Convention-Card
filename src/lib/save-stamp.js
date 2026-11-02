// Adds when a card was saved to the request BBO's editor sends. BBO keeps the
// extra element, and its editor ignores it and rebuilds the card from its form
// on every save, so a save without the extension removes the date rather than
// leaving a wrong one. Runs in the page, so it can import nothing shared.

/** `body` with the date added, if it saves an ACBL card's contents. Else `body`. */
export function stampSaveBody(body, nowSeconds) {
  if (typeof body !== 'string') return body
  if (!/(?:^|&)cmd=(?:insert|replace)(?:&|$)/.test(body) || !/&style=ACBL(?:&|$)/.test(body)) return body
  const stamp = `<E_bbccSaved t="${nowSeconds}"/>`
  // Text values are percent-encoded, so this can only be the card's own end.
  if (body.includes('</cc>')) return body.replace('</cc>', `${stamp}</cc>`)
  return body.replace(/(&cc=<cc\b[^>]*)\/>/, `$1>${stamp}</cc>`)
}
