#!/usr/bin/env bash
# Generate index.html for S3 + CloudFront SPA hosting from the Nitro node-server build.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4173}"
SERVER_ENTRY="${ROOT_DIR}/.output/server/index.mjs"
OUTPUT="${ROOT_DIR}/.output/public/index.html"

if [[ ! -f "$SERVER_ENTRY" ]]; then
  echo "Missing ${SERVER_ENTRY}. Run pnpm build first." >&2
  exit 1
fi

echo "==> Starting Nitro server on port ${PORT}"
PORT="$PORT" node "$SERVER_ENTRY" &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:${PORT}/" >/dev/null; then
  echo "Server did not become ready on port ${PORT}" >&2
  exit 1
fi

echo "==> Writing ${OUTPUT}"
curl -sf "http://127.0.0.1:${PORT}/" -o "$OUTPUT"
echo "Wrote $(wc -c < "$OUTPUT") bytes to ${OUTPUT}"
