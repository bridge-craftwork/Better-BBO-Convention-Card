# Privacy Policy — Better BBO Convention Card

**Last updated:** 27 November 2026

> The published policy is **<https://bridge-craftwork.com/bbo-cc/privacy/>**, the
> URL the store listings point at, served from `site/bbo-cc/privacy/index.html`
> in bridge-craftwork-site (a copy of `store/privacy-page.html` here). This file
> is the source; change all three together. The store reviewers' version is in
> `store/submission.md`.

## In short

Better BBO Convention Card works on your convention cards in Bridge Base
Online's card manager. It keeps nothing, and nothing leaves your browser except
to Bridge Base itself, unless you click **Edit on Bridge Craftwork** or **Save
to Bridge Classroom**.

## What it does

It adds buttons to Bridge Base Online's convention card pages: printing that
fits, the ACBL Classic and New PDFs, open in a tab, export and import, and links
that open a card in the Bridge Craftwork card editor or in Bridge Classroom.

## What it reads

- **Your cards**, from Bridge Base's own card pages: their titles, partners and
  contents, the way Bridge Base's card manager reads them.
- **Bridge Base's session for the card manager**, which Bridge Base puts in the
  address of its card pages. The extension uses it only to ask Bridge Base for
  your cards and to save them back, as the card manager does. It is not your
  password, which the extension never sees.
- **A file you choose to import**, in your browser.

It does not read anything else on the page or in your browser.

## What it keeps

Only your last choices in the Print and Export PDF dialogs (which ACBL card,
the second page, green or black, fillable or not), so the next PDF starts from
them, and whether you use Bridge Classroom at bridge-classroom.org or .com, so
Save to Bridge Classroom opens the one you're signed in on. They stay in the
extension's own storage on this device, and go nowhere.
Exports and PDFs are made in your browser and saved where your browser saves
downloads. A save date is kept
inside each card you save in Bridge Base's editor, on Bridge Base, so that an
import can tell which copy is newer.

## When anything leaves your browser

- **To Bridge Base**, when you export, import or open a card: requests to
  Bridge Base's own card pages, with its session, as its card manager makes.
  After an import saves a card, the extension tells Bridge Base the card changed,
  as Bridge Base's editor does after a save, so your partners see the new version.
- **Edit on Bridge Craftwork**, when you click it, opens that one card in the
  card editor at bridge-craftwork.com. **Save to Bridge Classroom** opens it in
  Bridge Classroom (bridge-classroom.org, or .com if that's where you use it), which saves it to your account there
  if you are signed in; the
  [Bridge Classroom privacy policy](https://bridge-classroom.org/privacy#extension)
  covers it from there. Either way the card travels in the part of the link
  after the `#`, which your browser does not send to any server. A card holds
  what you typed into it, which can include your partnership's names.

Nothing else. No analytics, no telemetry, no advertising, no tracking, and
nothing is sold or shared.

## Permissions

| Permission | Why |
|---|---|
| Site access to `webutil.bridgebase.com/v2/*` | Bridge Base Online's convention card pages, the only pages it works on |
| Safari only: site access to `www.bridgebase.com/v3/*` | BBO's lobby, which holds the card pages. Nothing runs there; Safari greys out the extension's toolbar button on any site it can't reach |
| Site access to `bridge-classroom.org` and `bridge-classroom.com` | Notes which of the two you visit Bridge Classroom at, so Save to Bridge Classroom opens that one. Nothing is read from those pages |
| Storage | Remembers your Print and Export PDF choices, and that Bridge Classroom address, on this device |

It asks for no other permissions.

## Source code

Open source, released under The Unlicense:
<https://github.com/bridge-craftwork/Better-BBO-Convention-Card>.

## Contact

Questions or problems:
<https://github.com/bridge-craftwork/Better-BBO-Convention-Card/issues>.
