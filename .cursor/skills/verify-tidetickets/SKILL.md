---
name: verify-tidetickets
description: Drive the Tide Tickets web app (TanStack Start frontend + NestJS API) through Playwright to prove user-facing behavior. Use before declaring frontend/API work done, after auth/checkout/scanner/check changes, or when an agent needs to reproduce a user-reported bug locally.
---

# Verify Tide Tickets

Tide Tickets is a **web UI** (primary surface) backed by a **REST + Socket.IO API**. Customers browse events, buy tickets, and view QR passes; admins manage events, orders, users, and scan tickets at the gate.

**Repos:** `ticket-frontend` (this repo, port **3000**) + sibling `ticket-api` (port **3001**, PostgreSQL).

## Launch

Playwright owns the full stack for verification runs. `playwright.config.ts` starts both servers via `webServer`:

| Service | Command | Ready when |
|---------|---------|------------|
| API | `pnpm start:dev` in `../ticket-api` | `GET http://localhost:3001/api/v1/health` returns 200 |
| Frontend | `pnpm dev` in ticket-frontend | `GET http://localhost:3000` returns 200 |

**One-time setup:**

```bash
# ticket-api
cd ../ticket-api
cp .env.example .env          # DATABASE_URL, JWT secrets required
docker compose up -d postgres # or use an existing Postgres on :5432
pnpm install
pnpm exec prisma migrate deploy
pnpm exec prisma db seed

# ticket-frontend
cd ../ticket-frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:3001
pnpm install
./node_modules/.bin/playwright install chromium
```

**pnpm note:** If `pnpm exec` or Playwright `webServer` fails with `ERR_PNPM_IGNORED_BUILDS`, either run `pnpm approve-builds` once interactively, or start servers with direct binaries (see Manual launch) and rely on `reuseExistingServer`.

**Admin credentials must match** between API seed and Playwright helpers. Export the same values everywhere:

```bash
export SEED_ADMIN_EMAIL=admin@tidetickets.com
export SEED_ADMIN_PASSWORD='TideAdmin2026!'
```

(`e2e/helpers/api.ts` reads these; defaults differ from seed if unset — always export before driving.)

**Manual launch** (without Playwright):

```bash
# terminal 1 — API
cd ../ticket-api && ./node_modules/.bin/nest start --watch

# terminal 2 — frontend
./node_modules/.bin/vite dev --port 3000
```

When servers are already running, Playwright reuses them (`reuseExistingServer: !process.env.CI`).

**Teardown:** Playwright stops `webServer` processes when the test run exits. If you started Postgres with the harness (`bootstrap-db`), run cleanup (below). Never `killall node`.

## Doctor

Read-only preflight. Run first when anything looks off.

```bash
export TIDETICKETS_RUN_ID="$(date +%Y%m%d-%H%M%S)"
.cursor/skills/verify-tidetickets/control-tidetickets.sh doctor
```

Doctor checks: Postgres reachable, API `/api/v1/health`, frontend `/`, admin login with `SEED_ADMIN_*`.

If Postgres is down:

```bash
.cursor/skills/verify-tidetickets/control-tidetickets.sh bootstrap-db
```

## Drive

Harness: **Playwright** (`@playwright/test`) with existing specs in `e2e/` and helpers in `e2e/helpers/`.

Read `.cursor/skills/verify-tidetickets/features/README.md` before driving. Each feature file lists user entry points, exact selectors, and proof criteria.

**Run one mapped feature** (Playwright starts servers automatically):

```bash
export TIDETICKETS_RUN_ID="$(date +%Y%m%d-%H%M%S)"
export SEED_ADMIN_EMAIL=admin@tidetickets.com
export SEED_ADMIN_PASSWORD='TideAdmin2026!'

# Example: public home smoke
.cursor/skills/verify-tidetickets/control-tidetickets.sh drive \
  e2e/public.spec.ts "home carga"

# Example: full purchase flow
.cursor/skills/verify-tidetickets/control-tidetickets.sh drive \
  e2e/customer-purchase.spec.ts "flujo completo"

# Example: gate scanner
.cursor/skills/verify-tidetickets/control-tidetickets.sh drive \
  e2e/admin.spec.ts "escáner valida"
```

Or invoke Playwright directly:

```bash
pnpm test:e2e e2e/public.spec.ts --grep "home carga"
```

**Stable handles** (prefer over CSS):

| Area | Handle |
|------|--------|
| Login | `getByLabel(/correo electrónico/i)`, `getByLabel(/contraseña/i)`, `getByRole('button', { name: /iniciar sesión/i })` |
| Register | `getByRole('button', { name: /crear cuenta\|registr/i })` |
| Event qty | `getByRole('button', { name: /aumentar cantidad de general/i })` |
| Checkout | `getByRole('button', { name: /continuar al pago/i })`, `/completar pago/i` |
| My tickets QR | `getByRole('img', { name: /código qr/i })` |
| Scanner | `getByLabel(/código del pase/i)`, `getByRole('button', { name: /^validar$/i })` |
| Check page | `getByRole('heading', { name: /verificación de entrada/i })` |

**Session injection** (skip flaky login when testing non-auth flows):

```typescript
import { injectSession } from './helpers/auth';
await injectSession(page, authPayload); // localStorage key: ticket-platform-auth-v1
```

**QR camera** (scanner): use `mockQrCameraScan(page, url)` from `e2e/helpers/auth.ts` — real camera access is not available in CI.

## Evidence

Proof artifacts land in:

```
.cursor/skills/verify-tidetickets/artifacts/<RUN_ID>/
  proof.meta          # run metadata
  playwright.log      # stdout
  test-results/       # screenshots/traces on failure
  playwright-report/  # HTML report
```

**Proof standards:**

- Exercise the **real user path** (UI clicks + API side effects), not test-only shortcuts alone.
- Capture **action + resulting state** (URL change, visible heading, QR image, toast).
- For mutations (purchase, scan), verify **side effects**: order status PAID, ticket `publicCode` exists via `/me/tickets`, scanner shows "pase válido" then "ya fue usada".
- `mock-pay` is the production mock payment boundary — acceptable for checkout proof.
- Report unreachable entry points with the attempted command and unmet precondition; do not claim a different path verifies the skipped one.

## Cleanup

```bash
.cursor/skills/verify-tidetickets/control-tidetickets.sh cleanup
```

- Stops Postgres **only if** this harness started it (`bootstrap-db`).
- Removes `/tmp/tidetickets-verify-*` state dir.
- **Preserves** `.cursor/skills/verify-tidetickets/artifacts/<RUN_ID>/`.
- Does **not** kill Playwright-managed dev servers by process name.

## Helpers

All invocations from repo root (`ticket-frontend`):

```bash
chmod +x .cursor/skills/verify-tidetickets/control-tidetickets.sh

.cursor/skills/verify-tidetickets/control-tidetickets.sh doctor
.cursor/skills/verify-tidetickets/control-tidetickets.sh bootstrap-db
.cursor/skills/verify-tidetickets/control-tidetickets.sh drive e2e/public.spec.ts "home carga"
.cursor/skills/verify-tidetickets/control-tidetickets.sh cleanup
```

API test helpers for seeding events/tickets: `e2e/helpers/api.ts` (`createPublishedEventWithTickets`, `purchaseTicket`, `login`).

## Isolation

- Playwright uses `workers: 1`, `fullyParallel: false` — one browser at a time.
- `reuseExistingServer: !process.env CI` — locally reuses running dev servers; set `CI=1` to force fresh instances.
- E2E creates disposable users/events via API (`@e2e.local` emails, `pw-<timestamp>` slugs) — no shared fixture file.
- **Do not** drive production (`tidetickets.com`) with this skill; local only.
- Two Playwright runs against the same DB are safe (unique emails/slugs) but share Postgres — avoid parallel `pnpm test:e2e` invocations.

## Maintenance

Run `/maintain-verification-skill` when routes, copy, or selectors change.
