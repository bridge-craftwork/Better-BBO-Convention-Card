#!/usr/bin/env bash
#
# Archive the Safari Mac app and upload it to App Store Connect. Adapted from
# bridge-classroom-fetch.
#
# USAGE
#   scripts/upload-apple.sh               # archive, export, upload
#   scripts/upload-apple.sh --no-upload   # archive and export, stop before uploading
#
# Run scripts/package-stores.sh first: it refreshes the extension files inside
# the Xcode project, which is what gets archived.
#
# Each run takes a fresh build number (yyyymmddHHMM), because App Store Connect
# rejects a build number it has seen, including from a failed upload. The
# marketing version comes from the project's MARKETING_VERSION.
#
# CREDENTIALS: the App Store Connect API key, from the login Keychain (synced
#   from 1Password by secrets-sync, family-computing/tools/secrets):
#   env/personal/ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_BASE64 (the .p8, base64).
#   The key is written to a private temporary folder for the run and deleted
#   afterwards.
#
# OUTPUT: dist/apple.noindex/ (.noindex: Spotlight skips it)
#
set -euo pipefail

# Xcode's packaging shells out to rsync and breaks with Homebrew's rsync 3.x.
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

UPLOAD=1
for arg in "$@"; do
  case "$arg" in
    --no-upload) UPLOAD=0 ;;
    *) sed -n '6,8p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
  esac
done

TEAM="8H3FX5B8KD"
DIST="dist/apple.noindex"
BUILD_NUMBER="${APPLE_BUILD:-$(date +%Y%m%d%H%M)}"
PROJECT="safari/Better BBO Convention Card/Better BBO Convention Card.xcodeproj"
RESOURCES="safari/Better BBO Convention Card/Better BBO Convention Card Extension/Resources"
SCHEME="Better BBO Convention Card"

[ -f "$RESOURCES/manifest.json" ] || { echo "$RESOURCES has no manifest; run scripts/package-stores.sh" >&2; exit 1; }
if grep -qE 'localhost|127\.0\.0\.1|github\.io' "$RESOURCES/manifest.json"; then
  echo "$RESOURCES holds a test build; rerun scripts/package-stores.sh" >&2
  exit 1
fi
MANIFEST_VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
if ! grep -q "MARKETING_VERSION = $MANIFEST_VERSION;" "$PROJECT/project.xcproj"; then
  echo "The Xcode project's MARKETING_VERSION is not $MANIFEST_VERSION (manifest.json). Bump it in project.xcproj (both targets)." >&2
  exit 1
fi

keychain() {
  security find-generic-password -a "$USER" -s "env/personal/$1" -w 2>/dev/null ||
    { echo "Keychain item env/personal/$1 is missing; run secrets-sync" >&2; exit 1; }
}
ASC_KEY_ID="$(keychain ASC_KEY_ID)"
ASC_ISSUER_ID="$(keychain ASC_ISSUER_ID)"
KEY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/bbcc-asc.XXXXXX")"
chmod 700 "$KEY_DIR"
trap 'rm -rf "$KEY_DIR"' EXIT
ASC_KEY_PATH="$KEY_DIR/AuthKey_$ASC_KEY_ID.p8"
(umask 077; keychain ASC_KEY_BASE64 | base64 -d > "$ASC_KEY_PATH")
# altool finds the key by its file name in this folder.
export API_PRIVATE_KEYS_DIR="$KEY_DIR"
AUTH=(-authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID" -authenticationKeyPath "$ASC_KEY_PATH")

mkdir -p "$DIST"
cat > "$DIST/ExportAppStore.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>export</string>
  <key>teamID</key><string>$TEAM</string>
  <key>signingStyle</key><string>automatic</string>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PLIST

ARCHIVE="$DIST/mac.xcarchive"
OUT="$DIST/mac"
echo "==> Archiving build $BUILD_NUMBER"
rm -rf "$ARCHIVE" "$OUT"
xcodebuild archive -project "$PROJECT" -scheme "$SCHEME" -configuration Release \
  -destination "generic/platform=macOS" -archivePath "$ARCHIVE" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  -allowProvisioningUpdates "${AUTH[@]}" -quiet

echo "==> Exporting for App Store Connect"
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist "$DIST/ExportAppStore.plist" \
  -exportPath "$OUT" -allowProvisioningUpdates "${AUTH[@]}" -quiet

PKG="$(find "$OUT" -maxdepth 1 -name '*.pkg' | head -1)"
[ -n "$PKG" ] || { echo "export produced no .pkg" >&2; exit 1; }
if [ "$UPLOAD" = 0 ]; then
  echo "==> Built $PKG (not uploaded)"
  exit 0
fi
echo "==> Uploading $(basename "$PKG")"
xcrun altool --upload-app -f "$PKG" -t macos --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
echo "==> Done (build $BUILD_NUMBER)."
