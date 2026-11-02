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
- **Import from JSON** — round-trip a card from another tool or backup.
- **Better PDF render** (future) — full ACBL-format three-column portrait
  layout, replacing the broken built-in print.

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
