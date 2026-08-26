# Admin scanner

Organizers validate tickets at the gate via manual code entry or QR camera scan on `/dashboard/scanner/`.

## Sub-features

- `scanner-manual-valid` — enter public code, **Validar** shows **pase válido**.
- `scanner-manual-used` — second validation shows **ya fue usada**.
- `scanner-camera` — mocked camera decodes check URL and validates.
- `dashboard-sections` — events, orders, scanner, users pages load for admin.

## How to get to it (user POV)

- Log in as admin → **Dashboard** → **Control de acceso** (`/dashboard/scanner/`).
- Type pass code in **Código del pase** field, click **Validar**.
- Or click **Escanear con cámara** (requires camera permission in real use; mocked in tests).

## Driving it with Playwright

Preconditions:

- Admin session (`injectSession` or `loginViaUi`).
- Purchased ticket with `publicCode` from `purchaseTicket`.

- **Manual validate.** Run `pnpm exec playwright test e2e/admin.spec.ts --grep "escáner valida un código"`. Fill `getByLabel(/código del pase/i)`, click `getByRole('button', { name: /^validar$/i })`, expect `/pase válido/i`; scan again → `/ya fue usada/i`.
- **Camera mock.** Run `--grep "escáner con cámara"`. `mockQrCameraScan(page, '<origin>/check/<code>')` before opening scanner; click **Escanear con cámara** → `/pase válido/i`.
- **Dashboard smoke.** Run `--grep "dashboard, eventos y pedidos"`. Headings for eventos, pedidos, control de acceso, usuarios visible; admin email listed on users page.
- **Proof.** Two-step scan proves side effect: first VALID, second ALREADY_USED — do not stop after first success only.

## Gotchas

- Real QR camera does not work headless — always use `mockQrCameraScan` for camera path.
- iOS/mobile scanner regressions were fixed separately — desktop Chromium is the harness default.
- Scanner modal flow may pause camera between scans — click **Escanear siguiente pase** before re-validating same code.
