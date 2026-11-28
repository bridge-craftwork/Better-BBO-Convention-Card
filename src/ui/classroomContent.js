// On Bridge Classroom's own pages: remember which address the user visits it
// at, .org or .com, so Save to Bridge Classroom opens the one they're signed in
// on (each keeps its own sign-in). As Fetch does (its ingestContent.js). Only
// "org" or "com" is stored; nothing is read from the page.

import browser from 'webextension-polyfill'
import { PREFERRED_TLD_KEY } from '../lib/classroom.js'

const host = window.location.hostname
if (host === 'bridge-classroom.org' || host === 'bridge-classroom.com') {
  browser.storage.local.set({ [PREFERRED_TLD_KEY]: host.endsWith('.org') ? 'org' : 'com' }).catch(() => {})
}
