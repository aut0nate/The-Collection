# AGENTS.md

## Project Overview

The Collection is a public catalogue of recommended apps, command line tools, and resources. It has a public browsing interface and a private owner-only admin portal for managing tools.

## Stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Docker Compose for local testing and VPS deployment

## Key Commands

```bash
npm install
npm run db:generate
npm run db:init
npm run db:seed
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Environment

Use `.env.example` as the template for `.env`.

Required variables:

- `DATABASE_URL`
- `DATA_DIR`
- `APP_URL`
- `AUTHENTIK_ISSUER`
- `AUTHENTIK_CLIENT_ID`
- `AUTHENTIK_CLIENT_SECRET`
- `AUTHENTIK_ADMIN_EMAIL`
- `SESSION_SECRET`

Optional variables:

- `OPENROUTER_API_KEY` enables admin AI suggestions for tool descriptions, categories, and tags.

Never commit `.env`, Authentik client secrets, session secrets, tokens, keys, or credentials.

Admin authentication is backed by Authentik OIDC for a single owner email address. Preserve the OIDC state, nonce, PKCE, RS256 ID token verification, owner-email allow-listing, signed HTTP-only cookies, `SameSite=Lax` app session cookies for the OAuth redirect flow, and callback error handling when changing this area.

## Code Style

- Use British English for user-facing text, comments, documentation, UI labels, and example content.
- Keep components small and readable.
- Prefer server components for database-backed pages.
- Use server actions for admin mutations.
- Keep public and admin behaviour separate.
- Do not add public detail pages unless the product scope changes.

## Data Rules

- New tools start as drafts unless explicitly published.
- Public pages must only show `PUBLISHED` tools.
- Tool cards link directly to the external website or GitHub repository.
- Platforms are `macOS`, `Linux`, `Windows`, `iOS`, `Android`, and `Web`.
- Logos may be remote URLs or uploaded files. Uploaded files live in the configured data directory.

## Testing Instructions

Before handing off changes, run:

```bash
npm run typecheck
npm run lint
npm run build
```

For UI changes, test both desktop and mobile widths. Confirm search, platform filters, category filters, Authentik admin login, and tool CRUD flows.

## Deployment Notes

The app is designed for Docker deployment on a public VPS route through Nginx Proxy Manager.

- Local Compose publishes `127.0.0.1:3000`.
- Production Compose joins `edge-net` and exposes port `3000` without publishing host ports.
- SQLite and uploaded logos persist in the `the-collection-data` Docker volume.
