#!/usr/bin/env bash
# Tide Tickets verification harness — launch, doctor, drive, cleanup.
# Usage: control-tidetickets.sh <doctor|bootstrap-db|drive|cleanup> [args...]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
API_DIR="$(cd "$ROOT/../ticket-api" && pwd)"
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="${TIDETICKETS_VERIFY_STATE:-/tmp/tidetickets-verify-$$}"
ARTIFACTS_ROOT="$SKILL_DIR/artifacts"
RUN_ID="${TIDETICKETS_RUN_ID:-$(date +%Y%m%d-%H%M%S)}"
ARTIFACTS_DIR="$ARTIFACTS_ROOT/$RUN_ID"

FRONTEND_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
API_URL="${PLAYWRIGHT_API_URL:-http://localhost:3001}"
ADMIN_EMAIL="${SEED_ADMIN_EMAIL:-admin@tidetickets.com}"
ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-TideAdmin2026!}"

mkdir -p "$STATE_DIR" "$ARTIFACTS_DIR"

log() { printf '[control-tidetickets] %s\n' "$*"; }
die() { log "ERROR: $*"; exit 1; }

port_open() {
  local host="$1" port="$2"
  (echo >/dev/tcp/"$host"/"$port") >/dev/null 2>&1
}

postgres_healthy() {
  docker compose -f "$API_DIR/docker-compose.yml" exec -T postgres \
    pg_isready -U postgres -d ticket_api >/dev/null 2>&1
}

started_postgres=false
if [[ -f "$STATE_DIR/started-postgres" ]]; then
  started_postgres=true
fi

cmd_doctor() {
  local ok=true
  log "Doctor — frontend=$FRONTEND_URL api=$API_URL admin=$ADMIN_EMAIL run=$RUN_ID"

  if docker compose -f "$API_DIR/docker-compose.yml" ps postgres 2>/dev/null | rg -q "running"; then
    if postgres_healthy; then
      log "postgres: healthy (docker compose)"
    else
      log "postgres: container running but not ready"
      ok=false
    fi
  elif port_open 127.0.0.1 5432; then
    log "postgres: port 5432 open (external instance)"
  else
    log "postgres: not reachable — run: control-tidetickets.sh bootstrap-db"
    ok=false
  fi

  if curl -sf "$API_URL/api/v1/health" >/dev/null 2>&1; then
    log "api health: ok ($API_URL/api/v1/health)"
  else
    log "api health: down — Playwright webServer or 'pnpm start:dev' in ticket-api"
    ok=false
  fi

  if curl -sf "$FRONTEND_URL/" >/dev/null 2>&1; then
    log "frontend: ok ($FRONTEND_URL)"
  else
    log "frontend: down — Playwright webServer or 'pnpm dev' in ticket-frontend"
    ok=false
  fi

  if curl -sf "$API_URL/api/v1/health" >/dev/null 2>&1; then
    local status body
    status=$(curl -s -o /tmp/tidetickets-login.json -w '%{http_code}' \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
      "$API_URL/api/v1/auth/login")
    if [[ "$status" == "200" || "$status" == "201" ]]; then
      log "admin login: ok"
    else
      log "admin login: failed (HTTP $status) — seed DB and align SEED_ADMIN_* with e2e helpers"
      ok=false
    fi
  fi

  $ok || exit 1
  log "doctor: pass"
}

cmd_bootstrap_db() {
  log "Starting postgres via docker compose (postgres service only)..."
  docker compose -f "$API_DIR/docker-compose.yml" up -d postgres
  echo "postgres" >"$STATE_DIR/started-postgres"
  started_postgres=true

  log "Waiting for postgres..."
  for _ in $(seq 1 30); do
    if postgres_healthy; then
      break
    fi
    sleep 1
  done
  postgres_healthy || die "postgres did not become healthy"

  log "Running prisma migrate deploy + seed..."
  (
    cd "$API_DIR"
    export CI=true
    export SEED_ADMIN_EMAIL="$ADMIN_EMAIL"
    export SEED_ADMIN_PASSWORD="$ADMIN_PASSWORD"
    pnpm exec prisma migrate deploy
    pnpm exec prisma db seed
  )
  log "bootstrap-db: done"
}

cmd_drive() {
  local spec="${1:-e2e/public.spec.ts}"
  local grep="${2:-home carga}"
  log "Drive — spec=$spec grep='$grep' artifacts=$ARTIFACTS_DIR"

  local pw="$ROOT/node_modules/.bin/playwright"
  [[ -x "$pw" ]] || die "Playwright not installed — run: pnpm install && ./node_modules/.bin/playwright install chromium"

  (
    cd "$ROOT"
    export PLAYWRIGHT_BASE_URL="$FRONTEND_URL"
    export PLAYWRIGHT_API_URL="$API_URL"
    export SEED_ADMIN_EMAIL="$ADMIN_EMAIL"
    export SEED_ADMIN_PASSWORD="$ADMIN_PASSWORD"
    "$pw" test "$spec" --grep "$grep" --reporter=list
  ) | tee "$ARTIFACTS_DIR/playwright.log"

  if [[ -d "$ROOT/test-results" ]]; then
    cp -R "$ROOT/test-results/." "$ARTIFACTS_DIR/test-results/" 2>/dev/null || mkdir -p "$ARTIFACTS_DIR/test-results" && cp -R "$ROOT/test-results/." "$ARTIFACTS_DIR/test-results/"
  fi
  if [[ -d "$ROOT/playwright-report" ]]; then
    cp -R "$ROOT/playwright-report/." "$ARTIFACTS_DIR/playwright-report/" 2>/dev/null || mkdir -p "$ARTIFACTS_DIR/playwright-report" && cp -R "$ROOT/playwright-report/." "$ARTIFACTS_DIR/playwright-report/"
  fi

  {
    echo "run_id=$RUN_ID"
    echo "frontend_url=$FRONTEND_URL"
    echo "api_url=$API_URL"
    echo "spec=$spec"
    echo "grep=$grep"
    echo "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  } >"$ARTIFACTS_DIR/proof.meta"

  log "drive: evidence at $ARTIFACTS_DIR"
}

cmd_cleanup() {
  log "Cleanup — state=$STATE_DIR (evidence in $ARTIFACTS_ROOT preserved)"

  if [[ -f "$STATE_DIR/started-postgres" ]]; then
    log "Stopping postgres container started by this harness..."
    docker compose -f "$API_DIR/docker-compose.yml" stop postgres || true
    rm -f "$STATE_DIR/started-postgres"
  fi

  rm -rf "$STATE_DIR"
  log "cleanup: done (Playwright webServer processes are managed by Playwright; do not kill node globally)"
}

case "${1:-}" in
  doctor) cmd_doctor ;;
  bootstrap-db) cmd_bootstrap_db ;;
  drive) shift; cmd_drive "$@" ;;
  cleanup) cmd_cleanup ;;
  *)
    echo "Usage: control-tidetickets.sh <doctor|bootstrap-db|drive|cleanup> [args...]" >&2
    exit 2
    ;;
esac
