#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "==> Bundling OpenAPI spec"
npx --prefix tooling redocly bundle api/openapi.yaml -o api/openapi.bundled.yaml

echo "==> Bundle written to api/openapi.bundled.yaml"
