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

### Option B — Static S3 + CloudFront (production)

GitHub Actions workflow `.github/workflows/deploy.yml` runs on every successful CI on `main`:

1. `pnpm build` with `VITE_API_BASE_URL=https://api.tidetickets.com`
2. `scripts/export-spa-shell.sh` — generates `index.html` from the Nitro server build
3. `aws s3 sync .output/public/` → `tidetickets-frontend-180294216289`
4. CloudFront invalidation (when `CLOUDFRONT_DISTRIBUTION_ID` variable is set)

Manual deploy:

```bash
export VITE_API_BASE_URL=https://api.tidetickets.com
pnpm build
bash scripts/export-spa-shell.sh
aws s3 sync .output/public/ s3://tidetickets-frontend-180294216289 --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

CloudFront must serve **403/404 → `/index.html`** for client-side routing (see `ticket-api/infra/cloudformation/ticket-frontend-cdn.yaml`).

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

## CI/CD on GitHub

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Lint, build, tests on every push/PR to `main` |
| `deploy.yml` | After CI on `main`: build → S3 sync → CloudFront invalidation |

Required secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. See [ticket-api/IMPLEMENTATION.md §10](https://github.com/HectorTorrez/ticket-api/blob/main/IMPLEMENTATION.md#10-cicd-with-github-actions).

---

## Related

- [README.md](./README.md) — project overview
- [ticket-api](https://github.com/HectorTorrez/ticket-api) — backend and AWS architecture
