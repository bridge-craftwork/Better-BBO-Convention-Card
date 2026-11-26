# Better BBO Convention Card — store screenshots

Taken 2026-11-25 from the live BBO lobby with the 1.0.0 Chrome build, by
`tools/capture-cc.mjs`.

2560×1600 (1280×800 at 2×) here, for the Mac App Store, and `listing-1280/`
the same set at 1280×800 for Chrome, Edge and Firefox, as with Fetch and DD.
Crop to the page: no browser chrome, so one set serves all four stores (Apple
refuses a competitor's browser in a screenshot).

| File | Shows |
|---|---|
| `1-card-list.png` | BBO's convention card list with the extension's toolbar (Export my cards, Import) and the ↗ on each row. **Lead with this one.** |
| `2-card-page.png` | A card opened full size in its own tab, with the extension's toolbar at top right |
| `3-print.png` | What Print (fixed) prints: the whole card on one landscape page |
| `4-acbl-pdf.png` | The card as the ACBL Classic PDF |
| `5-import.png` | The import question for a card that differs from one on BBO: keep, replace or keep both, with which copy is newer |

The card pages and PDFs use BBO's stock **ACBL SAYC**, which names nobody;
the list blurs every partner and every card title that holds a name. The two
PDFs are shown on a viewer's grey, without a viewer around them.

To retake them, as DD's were taken (`tools/capture-dd.mjs` in
bridge-classroom-fetch): run `tools/capture-cc.mjs` against a **copy** of a
signed-in Chromium profile with BBO's `invisible` flag set (the script refuses
otherwise). BBO allows one session per account, so a capture signs any other
session of that account out. The script writes nothing to the account: it
refuses `cc_cud.php` and `www_notify.php` at the network, answers every
confirm no, and answers the import question "keep".

```bash
npm run build
cp -R ~/.playwright-mcp/bbo-profile /tmp/bbo-profile-copy && rm -f /tmp/bbo-profile-copy/Singleton*
PROFILE=/tmp/bbo-profile-copy \
CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1255/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
node tools/capture-cc.mjs
rm -rf /tmp/bbo-profile-copy
```

Resize to `listing-1280/` with:

```bash
mkdir -p listing-1280 && for f in *.png; do sips -z 800 1280 "$f" --out "listing-1280/$f"; done
```
