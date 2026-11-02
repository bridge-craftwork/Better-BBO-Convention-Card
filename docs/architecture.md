# Better BBO Convention Card — design notes

A planning document for a future Chrome extension that improves the BBO
convention-card experience: better printing, import/export with a portable
JSON schema, and quality-of-life UI tweaks. This doc captures everything we
deduced about BBO's existing convention-card interface during a Chrome
DevTools exploration in May 2026 so the next developer (or future-us) can
start implementing without re-discovering the same facts.

---

## Why a new extension

BBO has a saved-convention-cards system: every logged-in user has a list of
"stock" cards (provided by BBO, e.g. ACBL SAYC) and "personal" cards (their
own creations, optionally shared with a named partner). The built-in
viewer/editor renders cards in a fixed 1786px-wide landscape layout. Three
problems result:

1. **Printing is broken.** The "Print" button is literally `window.print()`
   on the rendered DOM, and there is no `@media print` stylesheet. Chrome
   squishes the entire card onto one portrait letter page, clipping the
   rightmost ~15% of content.
2. **No portable export.** Cards live inside BBO's database. You cannot
   share a card with someone outside BBO, version-control it, or import
   one from another system. The data shape is undocumented.
3. **Cramped UI.** The card viewer/editor is shown inside an iframe in the
   BBO lobby's Account tab. The iframe is narrow and the card requires
   scrolling/panning to read.

This extension fixes all three.

---

## Proposed features

### v1 — quick wins, all DOM-injection
1. **Open in new tab** — add an "↗" icon to each card row in the list view
   and an "Open in full tab" button on the editor toolbar. Both use
   `window.open(<view-url>, '_blank')` so the card renders at full size.
2. **Print fix** — inject a `@media print` stylesheet into the editor
   pages that switches the layout to landscape letter, scales the card to
   fit the page width, hides chrome (the Print/font-size buttons), and
   avoids splitting rows across page breaks.
3. **Export single card as JSON** — on the editor, add an "Export JSON"
   button. Reads the already-loaded XML (the page has it in memory after
   `cc_fetch.php` returns), converts to our portable schema, downloads.
4. **Export all cards as JSON** — on the list view, add an "Export my cards"
   button, for the user's own cards and those shared with them; stock cards
   are left out (export one from its own page). Fetches `cc_list.php`, then
   iterates `cc_fetch.php?key=…` per card with a small concurrency cap, packages everything into one JSON
   file, downloads.

### v2 — import + custom render
5. **Import from JSON** — on the list view, "Import JSON" button. Reads a
   file, converts our schema back to BBO's XML form, POSTs to `cc_cud.php`
   for each card (`cmd=insert` or `cmd=replace`). Rules for cards already
   on BBO, in `src/lib/import-plan.js`: the same settings are skipped; a
   difference from one of your cards asks keep, replace or both, saying which
   is newer when the dates allow (below); a shared or stock card is never
   overwritten, and becomes a private "<title> (private)". ACBL cards only.
   A PDF goes through the same rules, read by the convention-card library's
   `importCard` and converted with `exportBboCard` (`src/lib/card-output.js`).
   So does the `.BBO.json` file from the bridge-craftwork.com editor's "Export
   for BBO" (see the schema's notes).
6. **ACBL PDFs** — "PDF: Classic" and "PDF: New" on the editor toolbar: the
   saved card through the convention-card library's `importBboJson` and
   `downloadAcblPdf` (`src/lib/card-output.js`, `src/lib/card-pdf.js`). ACBL
   cards only. Beside them, "Edit on Bridge Craftwork" and "Save to Bridge
   Classroom" open the library's hand-off links (`#import=v1.<data>`).

7. **Saved dates** — BBO records no dates, so the extension keeps its own:
   `<E_bbccSaved t="<seconds>"/>` in the card. `src/ui/editorPageWorld.js` adds it
   to the request when BBO's editor saves (`insert` or `replace`, so a title-only
   save counts), and import adds it to a card that has none. A card saved without
   the extension loses it, as BBO's editor rebuilds the card from its form, and
   is then of unknown age, never wrongly dated. It isn't a setting: comparisons
   skip it.

### Speculative
- "Compare cards" view — side-by-side diff of two of your saved cards.
- "Convention library" — a public read-only repository of common
  conventions (e.g., "2/1 with NMF"), importable in one click.

---

## What we know about BBO's convention-card interface

### Entry point
- BBO lobby (`www.bridgebase.com/v3/app/lv`) → right-side **Account** tab →
  **Convention cards** subtab.
- The subtab renders an `<iframe>` whose `src` is the ACBL CC Form Manager.

### URLs

| Page | URL template |
|---|---|
| List view (iframe) | `https://webutil.bridgebase.com/v2/acblCCFM/acblCCFM_bs.php?x=<hex>&mobile=y&v3b=web&v3v=<v>&v3u=BBO1` |
| ACBL card editor | `https://webutil.bridgebase.com/v2/acblcc/acblCC.html?edit=<y\|n>&key=<urlenc-key>&partner=<partner>` |
| V2 BASIC editor | `https://webutil.bridgebase.com/v2/v2cc/v2cc.html?edit=<y\|n>&key=<urlenc-key>&partner=<partner>` |
| V1 BASIC viewer | `https://webutil.bridgebase.com/v2/cs_render_cc.php?cckey=<urlenc-key>` |
| CC ("flexible") | `https://webutil.bridgebase.com/v2/fdcc/renderFD.html?edit=<y\|n>&key=<urlenc-key>&partner=<partner>` |

BBO's list opens these pages with all their parameters hex-encoded in `x`
(`?x=<hex of edit=n&key=…&partner=…>`), not in the URL as shown above;
`cardPageParams` in `src/lib/auth.js` reads both.

Title and partner are stored escaped by BBO's Save and escaped again in its XML
responses, so `A & B` arrives as `A &amp;amp; B`. Saving escapes once, as BBO
does, and the parsers decode the extra layer, as BBO's list does.

### Authentication
- URL param `x` is hex-encoded. Decoded form: `username|sessiontoken|`.
  Example: `6b656d69737472797c373631363939393833343135393734323233367c` →
  `kemistry|7616999834159742236|`.
- The session token is **not** the user's BBO password. It is issued by the
  BBO lobby when the iframe is constructed; it expires when the BBO session
  ends.
- Same `(user, password)` pair authenticates every endpoint below.
- Alternative auth form (rare): `u=<user>&p=<password>` as separate URL
  params. Both forms parsed by the same `gup("x")` / fallback logic.

### HTTP API

| Endpoint | Method | Body | Returns |
|---|---|---|---|
| `cc_list.php?v3u=BBO1` | POST | `user=&password=` | XML list of all cards |
| `cc_fetch.php` | POST | `key=&request_id=&v3u=` | XML of one card |
| `cc_cud.php?v3u=BBO1` | POST | (TBD — create/update/delete) | XML status |
| `cs_render_cc.php?cckey=` | GET | — | HTML render (V1BASIC only) |
| `www_notify.php?v3u=` | POST | `u=&p=&c=…` | Notifies partner of card changes |

All endpoints are on `webutil.bridgebase.com/v2/`. The CC manager's JS
refers to them via `webutil_dir + "<name>.php"` where `webutil_dir = "../"`
(i.e., one level up from `/v2/acblCCFM/`).

### `cc_list.php` response

XML with one `<cc_listitem>` per card:

```xml
<cc_list err="0">
  <cc_listitem self="kemistry"
               cc_key="ACBL/N/kemistry/1399129902_4125_aam135/1399129902"
               stock="N"
               style="ACBL"
               owner="kemistry"
               title="BMW"
               default="N"
               partner="aam135"/>
  ...
</cc_list>
```

| Attribute | Meaning |
|---|---|
| `self` | The requesting username |
| `cc_key` | Opaque card identifier; treat as a string, do not parse. Not unique in a list: one key can have a row for each partner |
| `stock` | `y` for built-in BBO/ACBL templates, `N` for personal |
| `style` | Card type — `ACBL`, `V2BASIC`, `V1BASIC`, or `CC` |
| `owner` | Who created/owns the card (`bbo` for stock, username for personal) |
| `title` | User-set display name |
| `default` | `Y` if this is the user's default card, else `N` |
| `partner` | The other player's BBO username (empty for solo cards) |

A single card can appear multiple times in the list, once per partner the
user has linked it to (e.g., four "ACBL SAYC" entries because the user has
used it with four different partners).

### Per-card DOM data

In the rendered list (`a.card-item` rows), each row has jQuery data
attached. Read via `$(row).data('cc_data')`:

```js
{
  stock: false,        // boolean
  ikey: '',            // unused / legacy
  title: 'BMW',
  partner: 'aam135',   // empty string if no partner
  favorite: false,
  cc_key: 'ACBL/N/kemistry/1399129902_4125_aam135/1399129902',
  hasPartner: true,    // derived from partner field
  type: 'ACBL'         // matches `style` from cc_list
}
```

The `cc_key`/`type`/`partner` triple is what the View/Edit handlers feed to
the editor URLs.

### `cc_fetch.php` response

XML wrapper element `<cc_card>` whose `cc` attribute is **HTML-entity-encoded
XML** containing every field of the card:

```xml
<cc_card err="0"
         cc_key="ACBL/N/kemistry/1399129902_4125_aam135/1399129902"
         stock="N"
         style="ACBL"
         owner="kemistry"
         title="BMW"
         default="n"
         indirect=""
         cc="&lt;cc filler=&quot;...&quot;&gt;&lt;E_names t=&quot;Rick and Art&quot;/&gt;&lt;E_majorOther1 t=&quot;Bergen Raises&quot;/&gt;...&lt;/cc&gt;"/>
```

Once decoded, the inner `cc` is a flat XML structure:

```xml
<cc filler="abcdefghij...">
  <E_names t="Rick and Art"/>
  <E_approach t="2/1 Game forcing (2/1 GIB with a few changes)"/>
  <E_majorOther1 t="Bergen Raises"/>
  <E_major3NTMin t="13"/>
  <E_major3NTMax t="15"/>
  <E_minorOther1 t="Inverted minors"/>
  <E_2CMin t="22"/>
  <E_2COther1 t="Or 9+ tricks"/>
  <E_1NTMin1 t="15"/>
  <E_1NTMax1 t="17"/>
  <E_1NSysOn t="Dbl, 2C"/>
  <E_1N3C t="pupp- show 5 only"/>
  <E_slamOther1 t="RKC 1430; 3014 minors, minwd 1430, AK Qbids, spec kings, exc 3014"/>
  ...
</cc>
```

Each field is an element named `E_<fieldname>` with a single `t` attribute
holding the text value. About 50–100 such elements per filled-out card.
The `filler` attribute is a padding string of no functional value (likely
included to ensure the XML body never collapses under whitespace/encoding
edge cases).

Known field-name prefixes:
- `E_names` — partnership/team display name
- `E_approach` — general approach text
- `E_1NT…`, `E_2NT…` — notrump opening ranges and conventions
- `E_major…`, `E_minor…` — opening suit details
- `E_2C…`, `E_2D…`, `E_2H…`, `E_2S…` — strong/weak 2-bid details
- `E_1N…` (subset of 1NT) — responses to 1NT
- `E_2N…`, `E_3N…` — responses to higher notrumps
- `E_dbl…`, `E_ocall…`, `E_cue…` — defensive structures
- `E_slam…` — slam toolkit
- `E_CNTOther…`, `E_other…` — miscellaneous

A full field catalog can be assembled by dumping every distinct element
name across a corpus of personal cards. (Stock cards skip many fields.)

### The card editor (`acblCC.html`)

- Standalone HTML page; uses jQuery 3.2.1, DOMPurify, and `acblCC.js`
  (~40 KB, last modified per its cache-buster on 2018-06-29).
- On load, calls `loadCC()` which does
  `loadXMLDoc(utilsURL + 'cc_fetch.php', 'key=' + convCardKey + '&…')`.
- Response handled by `processXMLData(data)`, which calls
  `populateControls(...)` to fill the form's 199-ish inputs from the
  inner `cc` XML.
- 199 inputs, **none with `name` attributes** — they're identified by
  position/parent context, not semantically. So reading values from the
  rendered DOM is fragile; always go through `cc_fetch.php` for export.
- The Print button (`printButtonClicked`) calls `window.print()` with no
  print-specific CSS. This is the source of every print complaint.
- The Edit-mode flag (`edit=y` in the URL) toggles `setEditMode(true)`,
  which enables form inputs and shows a Save button. Save serializes the
  form back to inner-XML and POSTs to `cc_cud.php` (still TBD format).

### Card types

| `style` | Editor URL | Notes |
|---|---|---|
| `ACBL` | `acblCC.html` | The traditional ACBL card; what BMW is. |
| `V2BASIC` | `v2cc.html` | BBO's "basic" card v2. Simpler than ACBL. |
| `V1BASIC` | `cs_render_cc.php` (HTML render only) | Legacy. View-only via PHP render. |
| `CC` | `fdcc/renderFD.html` | "Flexible CC" — different DOM, different schema. |

The proposed JSON schema (below) should at minimum cover ACBL, since that
is the most popular type. V2BASIC and CC support can be added later.

---

## Proposed JSON schema (draft)

A faithful, lossless export must preserve:
- Top-level metadata (title, partner, owner, type, default, stock)
- The `cc_key` (so re-import can target the same card)
- Every `E_*` field with its text value

A pragmatic shape:

```json
{
  "schema_version": "1.1",
  "exported_at": "2026-05-06T17:00:00Z",
  "source": "bbo-acbl",
  "cards": [
    {
      "cc_key": "ACBL/N/kemistry/1399129902_4125_aam135/1399129902",
      "title": "BMW",
      "partner": "aam135",
      "owner": "kemistry",
      "stock": false,
      "default": false,
      "style": "ACBL",
      "fields": {
        "names": "Rick and Art",
        "approach": "2/1 Game forcing (2/1 GIB with a few changes)",
        "majorOther1": "Bergen Raises",
        "major3NTMin": "13",
        "major3NTMax": "15",
        "1NTMin1": "15",
        "1NTMax1": "17",
        "...": "..."
      }
    }
  ]
}
```

Notes:
- The convention-card library's `exportBboFile` writes the same shape for the
  bridge-craftwork.com editor, one card to a file, with `source` set to
  `bridge-craftwork-card`. Import doesn't read `source`. A card made in that
  editor has no `cc_key`, `owner`, `partner`, `stock` or `default`, so it's added
  unless its title matches one of the user's cards.
- `conventions` and `leads` sit beside `fields`, holding the `C_` and `L_` elements.
- `fields` strips the `E_` prefix from BBO's element names for readability.
- Values stay as strings even when they look numeric (some "min" fields
  contain text like "thru 4!H" or are blank — keep round-trippable).
- For a semantically grouped variant ("opening", "responses to 1NT",
  "competitive", "slam", etc.) we can add a layer on top that groups fields
  into named sections, but the flat `fields` map remains the canonical form
  so adding new BBO fields later doesn't require schema changes.

Round-trip plan:
1. Export reads `cc` XML, strips `E_` prefix, drops `t` wrapper, emits JSON.
2. Import reads JSON, re-adds `E_` prefix, wraps in `<E_x t="..."/>`,
   reconstructs the `<cc filler="…">…</cc>` string, HTML-encodes, places in
   `cc=` attribute of `<cc_card>`, POSTs to `cc_cud.php`.

---

## Extension architecture

Mirroring the `acbl-live-fetch` extension's layout:

```
better-bbo-cc-extension/
├── manifest.json
│     content_scripts:
│       - matches: https://webutil.bridgebase.com/v2/acblCCFM/*
│         js: src/ui/listContent.js          (export-all, open-in-tab, import)
│       - matches: https://webutil.bridgebase.com/v2/acblcc/*
│                  https://webutil.bridgebase.com/v2/v2cc/*
│                  https://webutil.bridgebase.com/v2/cs_render_cc.php*
│         js: src/ui/editorContent.js        (print fix, open-in-tab, export)
│     permissions: ["downloads"]
│     host_permissions: ["https://webutil.bridgebase.com/*"]
├── src/
│   ├── background.js          (download orchestration if needed)
│   ├── parsers/
│   │   ├── cc-xml.js          (parse <cc_card> response → JSON)
│   │   └── cc-json.js         (JSON → <cc_card> for import)
│   ├── ui/
│   │   ├── listContent.js     (injects on list iframe)
│   │   ├── editorContent.js   (injects on editor pages)
│   │   └── print-styles.css   (the landscape fit-to-page rules)
│   └── lib/
│       └── auth.js            (decode `x` param, build URLs)
├── docs/
│   ├── architecture.md
│   ├── bbo-cc-format.md       (what's in this file, but pruned to spec)
│   └── json-schema.md
└── tests/
    └── parsers/
        ├── cc-xml.test.js
        └── cc-json.test.js
```

The JSON→PDF code is the convention-card library, a dependency pinned to a tag.

---

## Implementation order

1. Scaffold repo with manifest + Vite + crxjs (copy from `acbl-live-fetch`).
2. **Open in new tab** — proves the injection pattern works on both iframe
   contexts and gives an immediate win.
3. **Print fix** — inject the landscape-fit CSS already prototyped (see
   below). Test on ACBL, V2BASIC, V1BASIC, CC.
4. **`cc-xml.js` parser + tests** — XML → JSON, both directions, against
   fixtures saved from real cards (BMW etc.).
5. **Export single card** — wires the editor button to the parser and a
   download.
6. **Export all** — wires the list-view button to a list-fetch loop.
7. **Print fix v2** (after JSON→PDF library exists) — replaces the CSS
   injection with full re-render to PDF in proper ACBL format.
8. **Import** — discover `cc_cud.php` request shape (XHR-sniff while
   clicking Save in BBO's editor), then implement.

---

## Prototype print CSS (already tested in DevTools)

This is the v1 print fix. It hides the toolbar, scales the card to fit
landscape letter at its natural proportions, and prevents row-splitting at
page breaks:

```css
@media print {
  #buttonDiv, .form-header, .buttonStyle { display: none !important; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    overflow: visible !important;
  }
  #mainDiv {
    position: static !important;
    width: <natural-px>px !important;     /* measured at runtime */
    height: auto !important;
    overflow: visible !important;
    transform: scale(<scale>);             /* (10.4 * 96) / natural-px */
    transform-origin: top left;
  }
  #ccDiv {
    position: static !important;
    top: 0 !important;
    width: <natural-px>px !important;
    height: auto !important;
    overflow: visible !important;
    visibility: visible !important;
  }
  #entireTable td, #entireTable tr {
    page-break-inside: avoid !important;
  }
}
@page {
  size: letter landscape;
  margin: 0.3in;
}
```

The natural width must be measured at runtime — `#entireTable.getBoundingClientRect().width` — because Chrome's print preview otherwise applies its own scaling on top.

---

## Open questions

1. **`cc_cud.php` request format.** Read from BBO's Save in `acblCC.js`
   (`cmd`, `user`, `password`, `partner`, `default`, `title`, `style`, `cc`,
   `request_id`, `v3u`, and `cc_key` except on insert), answered by
   `<status err="0" cc_key="…"/>`. Checked against real saves (2026-11-02): a
   replace keeps the `cc_key`, so its numbers can't tell us when a card last
   changed; `cmd=delete` with `cc_key` removes a card. Still unknown: what
   `www_notify.php`, which the Save calls afterwards and we don't, does for a
   partner.
2. **V2BASIC and CC field catalogs.** Same approach as ACBL — dump
   `cc_fetch.php` responses and enumerate the element names.
3. **Whether BBO's session token survives Chrome restarts.** If so, we can
   cache it once the lobby is opened and use it from a popup later without
   the user having to keep the lobby tab open.
4. **Sharing.** `www_notify.php` is used to tell a partner about a card
   change; understand its parameters if we want "send this card to your
   partner" UX in the extension.
5. **iOS / Safari.** All endpoints are HTTP, but Safari's extension model
   is different. Defer until v1 is stable on Chrome/Edge.

---

## Discovery log

What we ran and what we learned, in order. Kept here so future-us can
re-validate any of these claims if BBO changes things.

1. **Where the CC UI lives.** `document.querySelector('account-screen-legacy')` exists in
   the BBO lobby DOM but is `display:none` on one of the routed screens; the
   visible one is in `mainDiv > screen > account-screen-legacy`.
2. **It's an iframe.** Searching for `Stock Cards` / `Personal Cards`
   text-containing elements returned nothing in the parent document.
   `document.querySelectorAll('iframe').length` returned 6, including one
   with `src` containing `acblCCFM`.
3. **The iframe app is Bootstrap+jQuery.** Stack: jquery-3.2.1, tether,
   bootstrap, sweetalert2. No Angular or React. PHP-served static page.
4. **Cards have no IDs in the DOM.** Each `a.card-item` row only has
   `class`, `data-toggle="modal"`, `data-target="#ActionModal"`. The card
   identity travels via jQuery data — `$(row).data('cc_data')` returns an
   object with `cc_key`, `type`, `partner`, etc.
5. **Action modal is a single shared dialog.** Clicking any card opens
   `#ActionModal` which has View/Edit/Delete buttons plus a partner input.
   Handlers branch on `selected_cc.type` to choose the editor URL.
6. **`cc_list.php` returns XML.** POST with `user=<name>&password=<token>`.
7. **`cc_fetch.php` returns XML with the card data in an attribute.** The
   inner content is HTML-entity-encoded `<cc>...</cc>` with `<E_*/>` elements.
8. **Print is `window.print()`.** Plain and simple — no print stylesheet,
   so Chrome compresses the 1786px-wide DOM into a portrait page and clips.
9. **Landscape fit-to-page CSS works as a quick fix.** Verified live in
   DevTools; the entire card renders readable across a landscape letter
   page with the columns at correct proportions.
