# Ticket Frontend

Web application for the digital ticketing platform. Customers browse events, reserve tickets, and view QR codes; organizers manage events, orders, and scan tickets at the gate.

**Repository:** [github.com/HectorTorrez/ticket-frontend](https://github.com/HectorTorrez/ticket-frontend)

## What it does

| Area | Routes | Description |
|------|--------|-------------|
| **Public** | `/`, `/events`, `/events/:slugOrId` | Event catalog and detail with live inventory |
| **Checkout** | `/events/:slugOrId/checkout` | Create order and mock payment |
| **Auth** | `/login`, `/register` | JWT session stored in `localStorage` |
| **Customer** | `/my-orders`, `/my-tickets` | Order history and ticket QR codes |
| **Gate check** | `/check/:publicCode` | Public ticket lookup |
| **Admin** | `/dashboard/*` | Events CRUD, orders, scanner, metrics |

## Tech stack

- **TanStack Start + Vite 8** — SSR app with file-based routing
- **Nitro** — Node server preset (`node-server`)
- **TanStack Router + Query** — routing and data fetching
- **Tailwind CSS 4 + shadcn/ui** — UI components
- **Socket.IO client** — live ticket inventory updates
- **Zod** — API response validation
- **Biome** — lint and format

## How it works

```
User browser
     │
     ▼
Nitro Node server (port 3000)  — SSR + static assets
     │
     ├── REST  → ticket-api  /api/v1/*  (VITE_API_BASE_URL)
     └── WS    → ticket-api  /inventory (JWT in auth handshake)
```

1. **HTTP:** `src/lib/api/client.ts` wraps `fetch` with Bearer tokens, automatic refresh on 401, and Zod validation. All domain calls live in `src/lib/api/ticket-api.ts`.
2. **Auth:** Session persisted under `ticket-platform-auth-v1` in `localStorage`. Route guards in `src/lib/auth/guards.ts` enforce `ADMIN` vs `CUSTOMER`.
3. **Realtime:** `use-inventory-socket` connects to the API Socket.IO namespace and refreshes availability when `tickets:update` fires.
4. **Data:** TanStack Query caches API responses (30s stale time) in route loaders and mutations.

There is **no dev proxy** — the API must expose CORS for `http://localhost:3000` (configured via `CORS_ORIGINS` on the API).

## Configuration

Copy [`.env.example`](./.env.example) to `.env`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:3001` | API host (without `/api/v1`; added in code) |
| `VITE_SOCKET_PATH` | `/socket.io` | Socket.IO path if non-default |

For production builds, set `VITE_API_BASE_URL` to your public API URL (e.g. `https://api.example.com`) **before** running `pnpm build`.

## Local development

**Prerequisites:** Node 20+, pnpm, [ticket-api](https://github.com/HectorTorrez/ticket-api) running on port **3001**.

```bash
pnpm install
cp .env.example .env

pnpm dev          # http://localhost:3000
```

## Production build

```bash
pnpm build
node .output/server/index.mjs
```

The build output lives under `.output/` (not `dist/`). Preview locally with `pnpm preview`.

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build (client + SSR + Nitro server) |
| `pnpm preview` | Preview production build |
| `pnpm test` | Vitest (passes when no test files exist) |
| `pnpm check` | Biome lint + format |
| `pnpm lint` | Biome lint only |
| `pnpm format` | Biome format |

## Project structure

```
src/
├── routes/              File-based pages (TanStack Router)
├── lib/
│   ├── api/             HTTP client, Zod schemas, typed API functions
│   ├── auth/            Session storage and route guards
│   └── websocket/       Inventory Socket.IO hook
├── components/ui/       shadcn components
└── integrations/        TanStack Query provider
```

## Related documentation

| Document | Content |
|----------|---------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | How to deploy the Nitro Node server or static hosting |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Full platform setup, AWS, and CI/CD (shared with API repo) |

**Backend:** [ticket-api](https://github.com/HectorTorrez/ticket-api) — see [API.md](https://github.com/HectorTorrez/ticket-api/blob/main/API.md) for endpoints.

## License

[MIT](./LICENSE) — free to use, modify, and fork.
