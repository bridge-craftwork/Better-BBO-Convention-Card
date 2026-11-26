#!/bin/bash
# Build store-ready archives for every target. Adapted from bridge-classroom-fetch.
#
#   scripts/package-stores.sh
#
# Produces dist/packages/better-bbo-convention-card-<version>-<target>.zip for
# Chrome, Edge and Firefox, plus a source archive for Firefox review. Safari is
# not a zip: it ships as a Mac app built in Xcode. This script refreshes the
# extension files that project bundles; scripts/upload-apple.sh archives it.

set -euo pipefail
cd "$(dirname "$0")/.."

NAME="better-bbo-convention-card"
SAFARI_PROJECT="safari"
SAFARI_RES="$SAFARI_PROJECT/Better BBO Convention Card/Better BBO Convention Card Extension/Resources"
VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT="dist/packages"

PKG_VERSION=$(python3 -c "import json;print(json.load(open('package.json'))['version'])")
if [ "$VERSION" != "$PKG_VERSION" ]; then
  echo "REFUSING: manifest.json says $VERSION, package.json $PKG_VERSION" >&2
  exit 1
fi

# The source archive is git archive of HEAD, so uncommitted work would make the
# zips and the source disagree, and AMO's reviewers rebuild from the source.
if [ -n "$(git status --porcelain -- src manifest.json package.json package-lock.json vite.config.js icons public)" ]; then
  echo "REFUSING: uncommitted changes to the extension's source; commit first" >&2
  git status --short -- src manifest.json package.json package-lock.json vite.config.js icons public >&2
  exit 1
fi

echo "==> $NAME $VERSION"
mkdir -p "$OUT"
rm -f "$OUT/$NAME-"*

# The Chrome Web Store rejects a manifest description over 132 characters, and
# App Store Connect one over 112 (error 90849); both only say so after the
# upload. vite.config.js gives Safari a shorter one.
guard_description_length() {
  local manifest="$1" limit="${2:-132}"
  python3 - "$manifest" "$limit" <<'PY'
import json, sys
d = json.load(open(sys.argv[1])).get('description', '')
limit = int(sys.argv[2])
if len(d) > limit:
    print(f"REFUSING: manifest description is {len(d)} chars, limit {limit}", file=sys.stderr)
    print(f"  {d}", file=sys.stderr)
    sys.exit(1)
PY
}

# Nothing but BBO's card pages: a localhost or test origin in a store build
# invites questions for no user benefit.
guard_test_origins() {
  if grep -qE "localhost|127\.0\.0\.1|github\.io" "$1"; then
    echo "REFUSING: $1 contains test-only origins" >&2
    exit 1
  fi
}

for target in chrome edge firefox; do
  echo "==> building $target"
  dir="dist/$target"
  BROWSER="$target" npx vite build >/dev/null
  guard_test_origins "$dir/manifest.json"
  guard_description_length "$dir/manifest.json"
  (cd "$dir" && zip -qrX "../../$OUT/$NAME-$VERSION-$target.zip" .)
done

# Firefox reviewers require buildable source when the submission is minified.
echo "==> source archive for Firefox review"
git archive --format=zip --prefix="$NAME-$VERSION/" HEAD -o "$OUT/$NAME-$VERSION-source.zip"

echo "==> refreshing Safari resources"
BROWSER=safari npx vite build >/dev/null
guard_test_origins dist/safari/manifest.json
guard_description_length dist/safari/manifest.json 112
if [ -d "$SAFARI_RES" ]; then
  rm -rf "${SAFARI_RES:?}/"*
  cp -R dist/safari/* "$SAFARI_RES/"
  echo "    updated $SAFARI_RES"
else
  echo "    no Xcode project yet; create one with:"
  echo "    xcrun safari-web-extension-converter dist/safari --project-location $SAFARI_PROJECT/ --macos-only \\"
  echo "      --app-name 'Better BBO Convention Card' --bundle-identifier org.bridge-classroom.better-bbo-convention-card --copy-resources"
fi

echo
ls -lh "$OUT"/"$NAME"-*
cat <<'TXT'

Next steps (store/submission.md has the text for every field)
  Chrome   upload the -chrome.zip at chrome.google.com/webstore/devconsole
  Edge     node scripts/upload-browsers.mjs edge   (a first listing: Partner Center)
  Firefox  node scripts/upload-browsers.mjs firefox (a first listing: Developer Hub,
           with the -firefox.zip AND the -source.zip)
  Safari   scripts/upload-apple.sh, then scripts/app-store-listing.mjs
TXT
