# Public catalog

Anonymous visitors browse the marketing home page and event catalog. Protected routes redirect to login.

## Sub-features

- `home-nav` — home loads with navigation links (login, events).
- `events-list` — `/events/` shows catalog heading or empty state.
- `auth-pages` — `/login/` and `/register/` render their headings.
- `dashboard-guard` — `/dashboard/` without session does not stay on dashboard.
- `my-tickets-guard` — `/my-tickets/` without session redirects to login.

## How to get to it (user POV)

- Open `/` in the browser.
- Click through to `/events/` from navigation or direct URL.
- Visit `/login/` or `/register/` from nav links.
- Attempt `/dashboard/` or `/my-tickets/` while logged out.

## Driving it with Playwright

Preconditions:

- Playwright `webServer` healthy (or manual `pnpm dev` + `pnpm start:dev`).
- No login required.

- **Home.** Navigate to `/`. Run `pnpm exec playwright test e2e/public.spec.ts --grep "home carga"`. Link matching `/iniciar sesión|eventos|entradas/i` is visible.
- **Events catalog.** Navigate to `/events/`. Run `--grep "catálogo de eventos"`. Heading or empty-state text visible within 20s.
- **Login page.** Navigate to `/login/`. Run `--grep "login y registro"`. Heading `/bienvenido/i` visible; then `/register/` shows create-account heading.
- **Dashboard guard.** Navigate to `/dashboard/` logged out. Run `--grep "ruta admin sin sesión"`. URL must not end at bare `/dashboard`.
- **My tickets guard.** Navigate to `/my-tickets/` logged out. Run `--grep "mis entradas sin sesión"`. URL matches `/login`.
- **Proof.** Run `control-tidetickets.sh drive e2e/public.spec.ts "home carga"`. Artifacts under `.cursor/skills/verify-tidetickets/artifacts/<RUN_ID>/`.

## Gotchas

- Event catalog may be empty on fresh DB — test accepts empty-state copy, not a specific event card.
- Trailing slashes: routes use TanStack Router paths like `/events/` and `/login/`.
- Do not use production URL; CORS and auth differ from local.
