// Runs in the MAIN world of BBO's ACBL card page: BBO's XMLHttpRequest can't be
// reached from a content script's isolated world. Dates each save (save-stamp.js).
// Anything going wrong here must not get in the way of the user's save.

import { stampSaveBody } from '../lib/save-stamp.js'

const urls = new WeakMap()
const { open, send } = XMLHttpRequest.prototype

XMLHttpRequest.prototype.open = function (method, url, ...rest) {
  urls.set(this, String(url))
  return open.call(this, method, url, ...rest)
}

XMLHttpRequest.prototype.send = function (body) {
  let stamped = body
  try {
    if (urls.get(this)?.includes('cc_cud.php')) stamped = stampSaveBody(body, Math.floor(Date.now() / 1000))
  } catch {
    stamped = body
  }
  return send.call(this, stamped)
}
