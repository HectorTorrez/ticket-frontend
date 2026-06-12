# Frontend Deployment

How to deploy **ticket-frontend** in development and production.

For the full platform guide (API + AWS + CI/CD), see the API repository:  
**[ticket-api/IMPLEMENTATION.md](https://github.com/HectorTorrez/ticket-api/blob/main/IMPLEMENTATION.md)**

---

## Build output

After `pnpm build`, Nitro produces:

| Path | Purpose |
|------|---------|
| `.output/server/index.mjs` | Node SSR server (current default) |
| `.output/public/` | Static assets (CSS, JS, images) |

Run production locally:

```bash
pnpm build
node .output/server/index.mjs
```

---

## Environment (build-time)

Set **before** `pnpm build`:

```env
VITE_API_BASE_URL=https://api.your-domain.com
# VITE_SOCKET_PATH=/socket.io
```

`VITE_*` variables are embedded at build time. Rebuild after changing them.

---

## Deployment options

### Option A — Node server (recommended today)

Matches the current Nitro **`node-server`** preset.

1. Build on CI or locally with production `VITE_API_BASE_URL`.
2. Copy `.output/` to the server (EC2, ECS, Render, Fly.io, etc.).
3. Run `node .output/server/index.mjs` (use PM2, systemd, or a container).
4. Expose port 3000 (or `PORT` if configured) behind HTTPS (ALB, reverse proxy).

**CORS:** ensure the API `CORS_ORIGINS` includes your frontend URL.

### Option B — Static S3 + CloudFront (future)

Requires a **static** Nitro preset or full prerender of all routes. Not configured in this repo yet.

When implemented:

```bash
pnpm build
aws s3 sync .output/public/ s3://your-frontend-bucket --delete
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

Configure CloudFront custom errors: **403/404 → `/index.html`** for client-side routing.

---

## Docker (optional, not in repo)

Example Dockerfile you can add later:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .output ./.output
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

Build the app first, then build the image from the `.output` artifact.

---

## CI on GitHub

The workflow `.github/workflows/ci.yml` runs `pnpm build` on every push/PR to `main`. No deploy step yet — see IMPLEMENTATION.md for future AWS automation.

---

## Related

- [README.md](./README.md) — project overview
- [ticket-api](https://github.com/HectorTorrez/ticket-api) — backend and AWS architecture
