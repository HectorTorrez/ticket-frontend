# Tide Tickets verification map

Read this index before driving the app. Each feature file is a recipe for one user-facing area.

## Baseline preconditions

- PostgreSQL running (`docker compose up -d postgres` in `ticket-api`, or external instance on `:5432`).
- `ticket-api`: `.env` with `DATABASE_URL`, JWT secrets; migrations applied; seed run.
- `ticket-frontend`: `.env` with `VITE_API_BASE_URL=http://localhost:3001`.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` exported and matching seed + `e2e/helpers/api.ts`.
- Playwright Chromium installed (`pnpm exec playwright install chromium`).
- Run `control-tidetickets.sh doctor` before driving when servers were not started by Playwright.

## Driving conventions

- Start from baseline unless a feature's preconditions say otherwise.
- Prefer ARIA roles and accessible names (Spanish UI copy) over CSS selectors.
- Use `injectSession` when the feature under test is not login itself.
- Seed events/tickets via `e2e/helpers/api.ts` when the UI path requires existing inventory.
- Restore nothing after read-only proofs; mutation proofs create disposable `@e2e.local` users.
- Do not delete proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and resulting state, not only the final screen.
- UI proof: Playwright assertion + `playwright.log` and `test-results/` screenshots on failure.
- Mutation proof: visible UI state **and** API outcome (order PAID, ticket code, scan status).
- Record feature ID and entry point in `proof.meta` via `control-tidetickets.sh drive`.
- Report unreachable paths with the attempted command and unmet precondition.

## Features

- [Public catalog](./public-catalog.md) — home, event list, auth redirects.
- [Customer auth](./customer-auth.md) — register, login, invalid credentials, role guards.
- [Customer purchase](./customer-purchase.md) — browse → checkout → mock pay → my tickets/orders.
- [Gate check page](./gate-check.md) — public `/check/:code` pass display and role-specific panels.
- [Admin scanner](./admin-scanner.md) — manual code entry and QR camera validation at the gate.
