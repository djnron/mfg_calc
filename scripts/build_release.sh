#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(python3 - <<'PY' "$ROOT/extension/manifest.json"
import json, sys
print(json.load(open(sys.argv[1], encoding='utf-8'))['version'])
PY
)"
RELEASE_DIR="$ROOT/releases"
mkdir -p "$RELEASE_DIR"

python3 "$ROOT/scripts/validate_data.py"

rm -f "$RELEASE_DIR/manufacturing-cost-estimator-extension-v$VERSION.zip"
(
  cd "$ROOT/extension"
  zip -qr "$RELEASE_DIR/manufacturing-cost-estimator-extension-v$VERSION.zip" .
)

rm -f "$RELEASE_DIR/manufacturing-cost-estimator-source-v$VERSION.zip"
(
  cd "$ROOT"
  zip -qr "$RELEASE_DIR/manufacturing-cost-estimator-source-v$VERSION.zip" \
    README.md LICENSE DATA-LICENSE.md CONTRIBUTING.md CODE_OF_CONDUCT.md \
    SECURITY.md CHANGELOG.md extension data docs examples scripts .github \
    -x 'releases/*' '*.DS_Store' '__pycache__/*'
)

echo "Built release files in $RELEASE_DIR"
