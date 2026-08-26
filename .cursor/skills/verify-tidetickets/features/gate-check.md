# Gate check page

Anyone with a ticket's public code can open `/check/:publicCode` to view the pass QR. Organizers see validation controls when logged in as ADMIN.

## Sub-features

- `check-guest` — guest sees verification heading, QR, scan instructions, organizer login link.
- `check-customer` — logged-in CUSTOMER sees pass but no organizer link.
- `check-admin` — ADMIN sees **Personal autorizado** panel and **Confirmar entrada** button.

## How to get to it (user POV)

- Open `/check/<publicCode>` from **Ver pase completo** on my-tickets or direct URL.
- As guest, click **Inicia sesión como organizador** → login with redirect param.
- As admin (already logged in), use **Confirmar entrada** on the same page.

## Driving it with Playwright

Preconditions:

- Ticket exists with known `publicCode` — create via `purchaseTicket(customerToken, ticketTypeId)` in helpers.
- Event published with at least one ticket type.

- **Guest view.** Run `pnpm exec playwright test e2e/check.spec.ts --grep "guest: enlace"`. Heading `/verificación de entrada/i`, text `/escanea en la entrada/i`, QR img visible; organizer link leads to `/login` with `redirect=` containing publicCode.
- **Customer view.** Run `--grep "cliente logueado"`. Same pass UI; organizer link count is 0.
- **Admin view.** Run `--grep "admin: no muestra enlace"`. Text `/personal autorizado/i`, button `/confirmar entrada/i` visible; no guest organizer link.
- **Proof.** QR image `getByRole('img', { name: /código qr/i })` visible; URL matches `/check/<code>`.

## Gotchas

- Copy says staff will scan the QR — there is no self-validate link for guests.
- `publicCode` is opaque — always obtain from API helper, not invented.
- Banner image requires API `bannerUrl` field + optional S3; may be absent locally without S3.
