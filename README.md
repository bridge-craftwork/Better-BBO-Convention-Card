# Better BBO Convention Card

Browser extension for Bridge Base Online's convention cards. It works inside
BBO's own card manager (web lobby → Account → Convention cards) and on each
card's page.

**Status:** 1.0.0 is being prepared for the Chrome Web Store, Edge Add-ons,
Firefox Add-ons and the Mac App Store. [store/submission.md](store/submission.md)
tracks each store and what still blocks it.

## Features

On a card's page (Print and Open in tab on every card type; the rest on ACBL
cards, BBO's usual kind):

- **Print (fixed)**: BBO's Print is a bare `window.print()` that clips the
  right-hand column. This prints the whole card across a landscape page.
- **ACBL PDFs**: download the card as the ACBL Classic or New convention card,
  what it says in green as BBO shows it (untick **Green ink** for black),
  rendered in the browser by the
  [convention-card](https://github.com/bridge-craftwork/convention-card) library.
- **Open in tab**: view or edit the card at full size instead of in BBO's
  narrow iframe.
- **Export JSON**: the card in a portable schema.
- **Edit on Bridge Craftwork** and **Save to Bridge Classroom**: open the card
  in the bridge-craftwork.com editor, or in Bridge Classroom, without a file.
  The card travels in the URL's fragment, which never reaches a server, and
  only when you click.

On the list of cards:

- **Export my cards as JSON**: all your own ACBL cards and those shared with
  you (stock cards one at a time, from their pages). BBO's other card types
  (basic, V2BASIC) are left out, and the export names them: only the ACBL
  card's elements are read.
- **Import from JSON or PDF**: this extension's export, the bridge-craftwork.com
  editor's "Export for BBO" file, or a PDF. A PDF this extension or the editor
  made carries the card inside it, with any boxes changed since; any other
  filled-in ACBL card or Bridgodex PDF is read from its boxes, less exactly. A
  card that differs from one on BBO is never replaced unasked, and the question
  says which copy is newer (the extension dates each save BBO's editor makes).
  After each card it saves, the import tells BBO, as BBO's editor does
  (`www_notify.php`), so partners pick up the change.
- **↗** on each row opens that card in a new tab.

It asks for no API permissions, only access to `webutil.bridgebase.com/v2/`,
where BBO's card pages live. No analytics, no storage, no servers of its own.
See the [privacy policy](store/privacy.md).

## Development

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
(Developer mode → Load unpacked). In Firefox, `about:debugging` → This Firefox
→ Load Temporary Add-on → `dist/firefox/manifest.json`. In Safari, open
`safari/Better BBO Convention Card/Better BBO Convention Card.xcodeproj` and
run it after `scripts/package-stores.sh` has refreshed its resources (Safari ▸
Settings ▸ Developer ▸ Allow unsigned extensions, for a local build).

[docs/architecture.md](docs/architecture.md) holds everything known about
BBO's convention-card API.

## Releasing

The process follows bridge-classroom-fetch's, which ships Bridge Classroom
Fetch and Bridge Craftwork DD to the same four stores.

| Step | How |
|---|---|
| Bump the version | `manifest.json`, `npm version <v> --no-git-tag-version`, and `MARKETING_VERSION` (both targets) in `safari/…/project.xcproj`; commit |
| Build every package | `scripts/package-stores.sh` → `dist/packages/`, and the Safari resources |
| Chrome | upload the `-chrome.zip` in the developer dashboard; paste the text from [store/submission.md](store/submission.md) |
| Edge, Firefox | `node scripts/upload-browsers.mjs edge\|firefox [--submit]` (a first listing is made on the website) |
| Safari | `scripts/upload-apple.sh`, then `scripts/app-store-listing.mjs`, then submit in App Store Connect |
| Icons | edit `icons/icon.svg`, then `npm run icons` |

[BUILD.md](BUILD.md) and `build.sh` are for Firefox's source review.
[THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md) lists what the builds bundle.

## License

The Unlicense.
