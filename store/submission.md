# Better BBO Convention Card — submission answers, paste-ready

Version **1.0.0**, a first listing everywhere: Chrome, Edge, Firefox
(addons.mozilla.org) and the Mac App Store. Built with
`scripts/package-stores.sh`, which writes
`dist/packages/better-bbo-convention-card-1.0.0-{chrome,edge,firefox,source}.zip`
and refreshes the Xcode project in `safari/`.

Modelled on Bridge Craftwork DD's submission (bridge-classroom-fetch,
`store/dd/submission.md`), which has been through all four stores; where this
differs, it says why.

**Before submitting, see [Blockers](#blockers) at the end.**

| Store | Status |
|---|---|
| Chrome Web Store | not submitted |
| Edge | not submitted; a first listing is made in Partner Center (the API refuses a first submission) |
| Firefox | **1.0.0 submitted 27 Nov**, a first listing created through the API (`upload-browsers.mjs firefox --submit`): add-on 3144782, slug `better-bbo-convention-card`, awaiting review, source archive attached |
| Mac App Store | **1.0.0 build 202611271833 submitted 27 Nov**, Waiting for Review; app id 6840230386 |

---

## Store listing

**Name**

```
Better BBO Convention Card
```

The name keeps "BBO", Rick's call (25 Nov 2026): the extension works only on
Bridge Base Online, and other extensions name it the same way. If a store
objects to the trademark, the fallback is a name without it, and only the
listing changes. The Firefox id and Apple bundle id say
`better-bbo-convention-card` either way.

**Short summary / subtitle**: 125 characters, inside Chrome's 132. The same
text is the manifest description; `package-stores.sh` refuses a longer one.
Safari's is 109, inside Apple's 112 (`vite.config.js`).

```
Print, back up and share your Bridge Base Online convention cards: ACBL PDFs, JSON and PDF import and export, full-size tabs.
```

**Description**

```
Better BBO Convention Card adds the things Bridge Base Online's convention card manager is missing, right inside it: Account, then Convention cards, in BBO's web lobby.

On a card (Print works on every card; the rest on ACBL cards, BBO's usual kind):
• Print that fits. BBO's Print clips the right-hand column; this prints the whole card across a landscape page.
• ACBL PDFs. Print or download the card as the ACBL Classic or the ACBL New convention card, filled in, with its notes or the ACBL scoresheet on the back if you like, what it says in green as BBO shows it (or in black), flat or fillable. Your choices are remembered.
• Open in a tab. See and edit the card at full size instead of in BBO's narrow panel.
• Export JSON. Save a copy of the card in a portable format.
• Edit on Bridge Craftwork, or Save to Bridge Classroom. Open the card in the bridge-craftwork.com card editor, or in Bridge Classroom, which saves it to your account there. No file to download and upload again.

On your list of cards:
• Print, save as a PDF, or view any card from its row, without opening it first.
• Sort the list by Title or Partner, and hide BBO's stock cards. Remembered.
• Export all your ACBL cards, and the ACBL cards partners have shared with you, in one JSON file.
• Import cards from a JSON file, from the bridge-craftwork.com editor's "Export for BBO" file, or from a PDF: one this extension or the bridge-craftwork.com editor made (the card travels inside it), or any filled-in ACBL convention card or Bridgodex PDF. A card that differs from one already on BBO is never replaced without asking, and the question says which copy is newer when it can tell. A card you don't own becomes a private copy.

The extension only runs on BBO's convention card pages, and only does anything when you click. It talks to BBO with the session BBO's page already has; it never sees your password. A card goes to Bridge Craftwork or Bridge Classroom only when you click that button, in the link's fragment, which never reaches a server.

No analytics, no tracking, no accounts. Open source.
```

**Category**: Productivity (Chrome, Edge) · Other (Firefox) · Utilities (Mac
App Store), as Fetch and DD.

**Privacy policy URL**

```
https://bridge-craftwork.com/bbo-cc/privacy/
```

**Homepage URL**

```
https://bridge-craftwork.com/bbo-cc/
```

**Support URL**

```
https://github.com/bridge-craftwork/Better-BBO-Convention-Card/issues
```

**Official URL** (Chrome): leave as None, as Fetch and DD do. It only offers
verified domains.

**Firefox: Android.** Leave Firefox for Android unticked. BBO's phone and
tablet lobby is a different page, which this doesn't run on, and the manifest
declares no `gecko_android`.

---

## Search terms (Edge)

Up to 7 terms, 30 characters each, 21 words in total across all of them. These
use 17 words; the longest is 20 characters. Rick swapped "bridge
partnership" for "Bridge Classroom" (27 Nov 2026), as in Fetch's.

```
convention card
ACBL convention card
BBO
Bridge Base Online
bridge bidding system
convention card PDF
Bridge Classroom
```

"BBO" and its long form, as in Fetch's: players type the acronym. "Convention
card" is what the extension is about, alone and with ACBL and PDF, the two
things people look for. `bridge` alone is left out, as in Fetch's: ambiguous,
and already in two terms.

## Screenshot titles (Edge)

One per screenshot, in `store/screenshots/listing-1280/` order.

1. `1-card-list.png`

```
Import, export and print from BBO's card list
```

2. `2-card-page.png`

```
Your card full size, with ACBL PDF export
```

3. `3-print.png`

```
Print the whole card on one page
```

4. `4-acbl-pdf.png`

```
The ACBL Classic card, filled in
```

5. `5-import.png`

```
Import from PDF or JSON, never overwriting without asking
```

---

## Single purpose

```
Adds printing, PDF downloads, import and export, and full-size viewing to the convention cards in Bridge Base Online's convention card manager.
```

---

## Permission justifications

The manifest asks for one API permission, `storage`, and no `tabs`,
`downloads` or `scripting`. (1.0.0 dropped `downloads`, which earlier builds
declared and never used, and the `www.bridgebase.com` host.) Files are saved
with an ordinary download link, and the hand-off links are opened with
`tabs.create`, which needs no permission.

**storage**:

```
Remembers the user's last choices in the Print and Export PDF dialogs (ACBL Classic or New, the second page, green or black entries, fillable or flat), so the next PDF starts from them; how the user sorts the card list and whether they hide its stock cards; and whether the user visits Bridge Classroom at bridge-classroom.org or bridge-classroom.com, so "Save to Bridge Classroom" opens the one they're signed in on. Kept in storage.local on the device; nothing else is stored and nothing is sent anywhere.
```

**Host permissions**: BBO's card pages, and Bridge Classroom's two addresses.

```
webutil.bridgebase.com/v2/ — Bridge Base Online's convention card manager and card pages, where the extension's buttons are added. Its requests go to the same BBO pages the card manager itself uses, with the session the page already has: to list, read and save the user's cards, and to tell BBO a card has changed after an import, as BBO's own editor does.

bridge-classroom.org and bridge-classroom.com — a content script on Bridge Classroom's own pages stores which of the two addresses the user visits ("org" or "com", nothing else), so "Save to Bridge Classroom" opens the one they are signed in on: the two keep separate sign-ins. It reads nothing from the page and sends nothing. No other host is requested.
```

**Content scripts in the page's world** (two, declared in the manifest with
`world: "MAIN"`). Chrome has no field for these; if a reviewer asks:

```
Two short scripts run in the page's own context on BBO's card pages, because BBO's pages forbid inline scripts (CSP script-src 'self') and the data they need is only there. On the card list, one copies each row's card details (BBO's own jQuery data: the card's key, type and partner) onto an attribute the extension's content script can read, so the "open in tab" button knows which card a row is. On a card page, the other adds the date to the card BBO's own Save sends, so a later import can say which copy is newer. Neither makes a request of its own.
```

**Remote code**: answer **No**.

```
No remote code. Everything the extension runs is in the package, including the PDF renderer and the two blank ACBL card PDFs it fills in.
```

---

## Data use

**Collected**: tick **Website content** and **Personally identifiable
information**, as Fetch and DD do, and for the same reason: "collect" in every
store's sense means *leaves the device*. One path does. **Edit on Bridge
Craftwork** and **Save to Bridge Classroom** put the card in a link to those
sites, and a card holds whatever the user typed into it, which can include the
partnership's names. That link's fragment never reaches a server, but the page
it opens reads it in the browser, and Bridge Classroom saves the card to the
user's account if they are signed in. Nothing else leaves the device except to
BBO itself.

Firefox's manifest declares `personallyIdentifyingInfo` and `websiteContent`
(`vite.config.js`), so the stores agree.

**Not ticked: Authentication information**, and this is the one answer that
needs thought, so here is why. The extension reads BBO's session token from
the URL BBO gives its own card manager, and sends it back to BBO with each
request, exactly as BBO's card manager does. It never leaves the browser for
anywhere but the BBO server that issued it, is never stored, and is not the
user's password. That is using the site's session, not collecting a
credential. If a reviewer disagrees, ticking it changes nothing else.

Not ticked either: Health, Financial, Personal communications, Location, Web
history, User activity.

**Certifications**: all three can be affirmed: not sold; not used for
unrelated purposes; not used for creditworthiness or lending.

**If a free-text field is offered**

```
The extension works on Bridge Base Online's convention card pages. It reads and saves the user's own cards through BBO's own card pages, with the session BBO's page already has, as BBO's card manager does; the session token is sent only back to BBO, and nothing is stored. Exports and PDFs are made in the browser and saved as ordinary downloads. Nothing leaves the device for us or a third party unless the user clicks "Edit on Bridge Craftwork" or "Save to Bridge Classroom", which opens that one card, in the link's fragment, on bridge-craftwork.com or bridge-classroom.org. No analytics, no telemetry, no third-party endpoint.
```

---

## Notes for reviewers

Unlike DD, **a reviewer can test everything with a free BBO account** made on
the spot: every account has BBO's stock cards, which open, print, export and
render as PDFs, and a new account can create and import cards of its own. We
still can't hand over ours (BBO allows one session per account, so reviewers
would sign each other out), and needn't.

Paste for Firefox and Apple. Chrome's test instructions field takes 500
characters, so use the short version there:

```
Needs a Bridge Base Online account; a free one works (bridgebase.com, Sign up). In BBO's web lobby open Account (right) > Convention cards. Next to BBO's New ACBL Convention Card button: Import from PDF or JSON, and Export my cards as JSON. Open any card, a stock card is fine: its toolbar has Open in tab, Export JSON, Print…, Export PDF…, Edit on Bridge Craftwork, Save to Bridge Classroom. Import the exported JSON to see the replace/keep question.
```

The full version:

```
This extension works inside Bridge Base Online's convention card manager, which needs a BBO account. A free account works and takes a minute to make at https://www.bridgebase.com (Sign up). We don't supply ours: BBO allows only one session per account, so a shared login would sign reviewers out of one another.

1. Sign in at https://www.bridgebase.com/v3/ (the web lobby). On the right, open Account, then Convention cards. Next to BBO's own "New ACBL Convention Card" button, two more appear: "Import from PDF or JSON" and "Export my cards as JSON". Each card row has three icons: Print and Save PDF (on ACBL cards) ask the same questions as the card page's Print… and Export PDF…; View opens the card in a new tab.
2. Click any card, then View (one of BBO's stock cards is fine). The card page gets a toolbar at the top right:
   - Print…: asks which card to print (ACBL Classic, ACBL New, or this page as BBO shows it, fitted to one landscape page; BBO's own print cuts off the right-hand column), the second page, and green or black entries.
   - Export PDF…: asks the same, plus fillable or flat, then downloads the card filled into the ACBL Classic or New convention card. The answers are remembered for next time.
   - Export JSON downloads the card.
   - Edit on Bridge Craftwork opens the card in the editor at bridge-craftwork.com; Save to Bridge Classroom opens it in Bridge Classroom. The card travels in the link's fragment.
3. Back on the list, "Import from PDF or JSON" with the file from step 2 (or a PDF from Export PDF…) adds the card to the account. Importing a file whose card already exists on the account, with different settings, asks whether to keep, replace or keep both. A new account starts with no cards of its own, so the first import adds one.

The extension's one API permission, storage, remembers the PDF dialog's answers on the device. Its requests go only to BBO's own card pages on webutil.bridgebase.com, with the session the page already has.
```

**Apple: add this.** As with Fetch and DD, a reviewer who skips it sees
nothing.

```
In Safari, after enabling the extension in Safari > Settings > Extensions, also allow it on webutil.bridgebase.com, using the extension's button in the toolbar while the convention cards are open (BBO shows them in a frame from that site). Safari asks per website; until it is allowed there, nothing appears, with no error. It also asks for www.bridgebase.com, BBO's lobby, only so that its toolbar button isn't greyed out there: no script runs on the lobby.
```

**For addons.mozilla.org, add**: after the full version, in the same field.

```
Build: ./build.sh (runs npm ci, then BROWSER=firefox npx vite build); output in dist/firefox. We have verified that this reproduces the uploaded package byte for byte from the attached source archive. BUILD.md has the details, including the two linter warnings: both DANGEROUS_EVAL, both inside @pdf-lib/fontkit's published prebuilt bundle (the function-bind polyfill and get-intrinsic's reference to eval), neither reached by the extension. No first-party code uses eval.
```

---

## Release notes — 1.0.0

```
First release. Print that fits the whole card, the ACBL Classic and New PDFs, open in a full-size tab, export and import as JSON or PDF, and hand-off to the Bridge Craftwork card editor and Bridge Classroom, all inside Bridge Base Online's convention card manager.
```

---

## Assets

| | |
|---|---|
| Icon | `icons/icon-128.png`; Edge's 300×300 store logo is `icons/icon-300.png`; Firefox's listing takes `icon-128.png` (`scripts/upload-browsers.mjs firefox --images`) |
| Mac app icon | rendered into the Xcode project's asset catalog by `node scripts/render-icons.mjs` |
| Screenshots | `store/screenshots/listing-1280/`, 1280×800 (Chrome, Edge, Firefox); `store/screenshots/`, 2560×1600 (Mac App Store); see that folder's README |
| Privacy page | to publish at https://bridge-craftwork.com/bbo-cc/privacy/, from `bridge-craftwork-site/site/bbo-cc/privacy/index.html` (copy of `store/privacy-page.html`) |
| Homepage | to publish at https://bridge-craftwork.com/bbo-cc/ |

---

## Blockers

Things only Rick can do, in the order they block:

1. ~~**Approve the icon**~~: approved 2026-11-26 (`icons/icon.svg`: the Fetch
   and DD mortarboard with a green CC badge).
2. ~~**Privacy page**~~: live 2026-11-26; the `storage` update
   ([bridge-craftwork-site#24](https://github.com/bridge-craftwork/bridge-craftwork-site/pull/24))
   live 2026-11-27. First version merged
   [bridge-craftwork-site#23](https://github.com/bridge-craftwork/bridge-craftwork-site/pull/23)
   (`/bbo-cc/` and `/bbo-cc/privacy/`). Every store checks the privacy URL.
   The Safari lobby row, the Bridge Classroom .org/.com access and the list's
   sort ([bridge-craftwork-site#25](https://github.com/bridge-craftwork/bridge-craftwork-site/pull/25))
   live 2026-11-27.
3. **Test on real BBO.** *Chrome: done 2026-11-27*, by a Playwright run of the
   store build (no `storage`, `downloads` or `www.bridgebase.com`
   permissions) on Rick's account, 25 of 26 checks passing: the list toolbar
   and ↗ on every row; row data from the MAIN-world script; Export my cards
   (all 18 own and shared cards); the card tab's Export JSON, both PDFs,
   Print (one landscape page, ACBL and V2BASIC) and both hand-offs; BBO's View
   in the lobby panel and its ↗ Open in tab; import of an unchanged card (no
   save), of a file with no cards, of a new card (added, settings intact), of
   a changed card (asked, replaced, dated), and of the extension's own PDF
   (no save); BBO's own editor Save dated by the MAIN-world script, and the
   date kept. Writes went only to a throwaway card, deleted afterwards;
   `www_notify.php` was blocked. The one failure: **V2BASIC cards exported
   empty** (title and key, no settings). Rick, 2026-11-27: no basic-card
   support. Fixed the same day: Export my cards leaves them out and names
   them, a basic card's page offers only Print and Open in tab, and the
   listing says ACBL cards (rechecked live, 15/15).
   *Still to do:* Firefox and Safari by hand (Edge runs the Chrome build).
   The **partner notice** after an import ships untested and isn't in the
   listing's features (Rick, 2026-11-27: testing it needs more people). It
   sends the same request BBO's own editor sends and ignores the reply, so at
   worst a partner doesn't see the change until they reopen the card; the
   privacy policy still describes it, because the request is made.
4. ~~**Safari: the two `world: "MAIN"` scripts.**~~ They work: Rick opened a
   card from the list in Safari, 2026-11-27. (The row icons now: Print, Save
   PDF, View; Print and Save PDF show once the row's details arrive.)
   Was: The Xcode converter warned that
   Safari doesn't support `world`. It warned the same about the background's
   `type: module`, which Fetch and DD use in Safari without trouble, so the
   warning may be stale; but if `world` is ignored, those scripts run isolated
   and fail quietly: ↗ on the list does nothing, and saves made in BBO's editor
   carry no date. Everything else works. Check ↗ in Safari; if it's dead, the
   list's ↗ needs a fallback that matches rows to `cc_list.php` by title and
   partner.
5. ~~**Screenshots**~~: retaken 2026-11-27 for the list's buttons, row icons
   and Hide.
   First taken 2026-11-25 (`store/screenshots/`). Taking them
   found Print (fixed) put the lower half of an ACBL card on a second page
   (it scaled with a transform, which doesn't shrink the layout); it now
   zooms, and fits the whole card on one page. Check a real Print in Chrome,
   Firefox and Safari as part of 3.
6. **Store records**: Chrome (new item in the developer dashboard), Edge
   (Partner Center, then copy the product id into
   `scripts/upload-browsers.mjs`), Firefox (Developer Hub, with the source
   archive), App Store Connect (new macOS app for
   `org.bridge-classroom.better-bbo-convention-card`, then
   `scripts/upload-apple.sh` and `scripts/app-store-listing.mjs`).
