# Better BBO Convention Card — store screenshots

**Not taken yet.** They need a signed-in BBO session.

2560×1600 (1280×800 at 2×) here, for the Mac App Store, and `listing-1280/`
the same set at 1280×800 for Chrome, Edge and Firefox, as with Fetch and DD.
Crop to the page: no browser chrome, so one set serves all four stores (Apple
refuses a competitor's browser in a screenshot).

| File | Shows |
|---|---|
| `1-card-list.png` | BBO's convention card list with the extension's toolbar (Export my cards, Import) and the ↗ on each row. **Lead with this one.** |
| `2-card-page.png` | A card opened full size in its own tab, with the extension's toolbar at top right |
| `3-print.png` | The print preview: the whole card across a landscape page, beside BBO's own clipped print if it fits |
| `4-acbl-pdf.png` | The card as the ACBL Classic (or New) PDF, open in a PDF viewer |
| `5-import.png` | The import question for a card that differs from one on BBO: keep, replace or keep both, with which copy is newer |

How DD's were made, and the way to do these: `tools/capture-dd.mjs` in
bridge-classroom-fetch, a Playwright script run against a **copy** of a
signed-in Chromium profile with BBO's `invisible` flag set, loading
`dist/chrome`. BBO allows one session per account, so a capture signs any
other session of that account out. Use a card that names no real partner, or
blur the partner column, as Fetch's and DD's sets blur names.

Resize to `listing-1280/` with:

```bash
mkdir -p listing-1280 && for f in *.png; do sips -z 800 1280 "$f" --out "listing-1280/$f"; done
```
