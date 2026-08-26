# Customer auth

Customers and admins sign in through the login form. Registration creates a CUSTOMER account. Role guards block customers from the admin dashboard.

## Sub-features

- `admin-login-ui` — admin credentials reach `/dashboard`.
- `customer-register` — new email registers and lands on home.
- `invalid-credentials` — wrong password shows error toast/message; stays on login.
- `customer-dashboard-deny` — CUSTOMER session cannot access `/dashboard`.

## How to get to it (user POV)

- Open `/login/`, enter email and password, click **Iniciar sesión**.
- Open `/register/`, fill email and password, click **Crear cuenta**.
- With a customer session, navigate to `/dashboard/`.

## Driving it with Playwright

Preconditions:

- Seeded admin exists (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
- API health OK.

- **Admin login.** Run `pnpm exec playwright test e2e/auth.spec.ts --grep "admin inicia sesión"`. Uses `loginViaUi(page, ADMIN_EMAIL, ADMIN_PASSWORD)`; URL matches `/dashboard`, dashboard heading visible.
- **Customer register.** Run `--grep "cliente se registra"`. Unique `ui_reg_<timestamp>@e2e.local` email; lands on home `/`.
- **Invalid credentials.** Run `--grep "credenciales inválidas"`. Error text or Sonner toast visible; URL stays on `/login`.
- **Customer deny.** Run `--grep "cliente no puede entrar"`. Injects CUSTOMER session via `injectSession`; `/dashboard/` redirects away.
- **Proof.** `control-tidetickets.sh drive e2e/auth.spec.ts "admin inicia sesión"`.

## Gotchas

- Admin email/password must match API seed — mismatch is the #1 auth failure in local verify runs.
- Login UI labels are Spanish: `/correo electrónico/i`, `/contraseña/i`.
- `injectSession` sets `localStorage` key `ticket-platform-auth-v1` before navigation.
