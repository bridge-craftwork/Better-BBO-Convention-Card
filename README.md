# Better BBO Convention Card

Browser extension that improves BBO's saved-convention-card experience.

**Status:** scaffolding only — implementation in progress. See
[docs/architecture.md](docs/architecture.md) for the full design plus
everything we know about BBO's convention-card API.

## Planned features

- **Open in new tab** — view/edit a card at full size instead of inside
  BBO's cramped iframe.
- **Print fix** — replace BBO's broken `window.print()` (which clips the
  rightmost column) with proper landscape fit-to-page output.
- **Export to JSON** — any single card, or all your own cards and cards shared
  with you (stock cards one at a time), in a portable schema.
- **Import from JSON or PDF** — round-trip a card from another tool or backup.
  JSON can be this extension's export or the bridge-craftwork.com editor's "Export
  for BBO" file. A PDF can be one this extension or the bridge-craftwork.com editor made (the card
  travels inside it, with any boxes changed since), or any filled-in ACBL card or
  Bridgodex PDF, whose boxes are read less exactly.
- **ACBL PDFs** — download a card as the ACBL Classic or New card, rendered in
  the browser by the [convention-card](https://github.com/bridge-craftwork/convention-card)
  library.
- **Open elsewhere** — open a card in the bridge-craftwork.com editor, or save it
  to Bridge Classroom, without a file. The card travels in the URL's fragment,
  which never reaches a server, and only when you click.

## Development

Same build setup as [acbl-live-fetch](https://github.com/Rick-Wilson/acbl-live-fetch).

```bash
npm install
npm run build           # Chrome build (default) → dist/chrome/
npm run build:firefox   # → dist/firefox/
npm run build:edge      # → dist/edge/
npm run build:safari    # → dist/safari/
npm run build:all       # all four
npm test                # vitest run
```

Load `dist/chrome/` as an unpacked extension in `chrome://extensions`
(Developer mode → Load unpacked) for local testing.

## License

The Unlicense — same as Rick's other repos under `github.com/Rick-Wilson`.
