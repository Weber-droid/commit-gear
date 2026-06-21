#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "==> Spectral lint"
npx --prefix tooling spectral lint api/openapi.yaml --ruleset api/spectral.yaml

echo "==> Spectral lint passed"
