# Customer purchase

A logged-in customer selects tickets for a published event, completes mock checkout, and sees the order and QR pass.

## Sub-features

- `purchase-full` — event detail → quantity → checkout → mock pay → my-orders → my-tickets QR.
- `checkout-auth-guard` — checkout without session redirects to login.
- `check-link` — **Ver pase completo** opens `/check/:publicCode`.

## How to get to it (user POV)

- Browse to `/events/<slug>/`, increase **General** quantity, click **Continuar al pago**.
- On checkout, click **Completar pago** after reservation confirms.
- Open **Mis entradas** (`/my-tickets/`) and **Mis pedidos** (`/my-orders/`).

## Driving it with Playwright

Preconditions:

- Admin API token available (`login(ADMIN_EMAIL, ADMIN_PASSWORD)`).
- Test creates its own published event via `createPublishedEventWithTickets`.
- Customer session injected or registered inline.

- **Full flow.** Run `pnpm exec playwright test e2e/customer-purchase.spec.ts --grep "flujo completo"`. Steps: inject customer → event page → increase General qty → checkout → mock pay → `/my-orders/` shows paid → `/my-tickets/` shows event title + QR img + **Ver pase completo** link.
- **Auth guard.** Run `--grep "checkout sin sesión"`. Logged-out checkout redirects to `/login`.
- **Check link.** Run `--grep "Ver pase completo"`. After purchase, link opens `/check/` with event title visible.
- **Proof.** Side effects: order status PAID (visible on my-orders), QR `img` with accessible name containing event title.

## Gotchas

- Reservation step shows `/reserva confirmada|reservando/i` — wait before clicking pay.
- Mock payment uses API `POST /orders/:id/mock-pay` with `{ outcome: "SUCCESS" }` — not a real PSP.
- Each run creates a new event slug (`pw-<timestamp>`) — no fixture slug to hardcode.
- Checkout timeout is 25–90s depending on API cold start.
