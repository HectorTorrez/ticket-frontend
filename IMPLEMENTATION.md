# Implementation Guide (Frontend)

This document summarizes frontend-specific steps. The **complete** platform guide (local stack, AWS, S3, CI/CD) lives in the API repository:

👉 **[github.com/HectorTorrez/ticket-api/blob/main/IMPLEMENTATION.md](https://github.com/HectorTorrez/ticket-api/blob/main/IMPLEMENTATION.md)**

---

## Quick start

```bash
# Terminal 1 — API (see ticket-api IMPLEMENTATION.md)
cd ticket-api && pnpm run start:dev

# Terminal 2 — Frontend
cd ticket-frontend
cp .env.example .env
pnpm dev
```

Open http://localhost:3000 (frontend) — API at http://localhost:3001.

---

## Frontend-only checklist

- [ ] `VITE_API_BASE_URL` points to running API
- [ ] API `CORS_ORIGINS` includes `http://localhost:3000`
- [ ] `pnpm build` succeeds
- [ ] Production: set `VITE_API_BASE_URL` **before** build
- [ ] Deploy `.output/server/index.mjs` or plan static S3 hosting (see [DEPLOYMENT.md](./DEPLOYMENT.md))

---

## What works without extra AWS config

| Feature | Needs S3? |
|---------|-----------|
| Browse events | No |
| Checkout + mock pay | No |
| My tickets / QR display | No |
| Admin dashboard (no banner upload) | No |
| Admin event banner upload | Yes — API needs `S3_BUCKET` |

---

## CI

GitHub Actions runs `pnpm build` on push/PR to `main`. See `.github/workflows/ci.yml`.
