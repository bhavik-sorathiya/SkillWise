# SkillWise

SkillWise is a full-stack web application: a React (Vite) frontend and a Node.js + Express backend with MySQL and Socket.IO for real-time mock interviews & resume analysis.

This README covers quick setup, run commands, required environment variables, documentation links, troubleshooting, and **Pre-Launch Checklist** instructions.

## Project layout

- `client/` – React + Vite frontend
- `server/` – Express backend, Socket.IO, AI integration
- `docs/` – Canonical project documentation (architecture, API, deployment, etc.)

## Prerequisites

- Node.js 18+ and npm
- MySQL 8+ (or a compatible managed MySQL instance)

## Quick Setup (root)

Install dependencies for the workspace (client + server):

```bash
npm run setup
```

Start frontend and backend concurrently (development):

```bash
npm run dev
```

Run only frontend:

```bash
npm run client
```

Run only backend:

```bash
npm run server
```

Build production frontend:

```bash
cd client
npm run build
```

## Environment variables

Backend (`server/.env`):

- `PORT` (default `3000`)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`
- `GEMINI_API_KEY` or `GEMINI_API_KEY_1` (required for AI features)
- `GEMINI_API_KEY_2` (optional fallback)
- `RESUME_ANALYSIS_TIMEOUT` (ms, optional)
- `NODE_ENV` (`development|production`)
- `ALLOWED_ORIGINS` (Comma-separated origins for CORS, e.g. `http://your-frontend-domain.com,http://localhost:5173`)
- `SENTRY_DSN` (Optional: for backend error tracking)

Frontend (`client/.env`):

- `VITE_API_URL` (e.g. `http://localhost:3000/api` or your deployed backend URL)
- `VITE_SOCKET_URL` (e.g. `http://localhost:3000` or your deployed backend URL)
- `VITE_SENTRY_DSN` (Optional: for frontend error tracking)

## Pre-Launch / Deployment Checklist

Before taking the application live, review the following external configurations that need to be managed through your hosting platforms:

1. **Uptime Monitoring**
   - Use a free service like **UptimeRobot** or **Better Uptime**.
   - Point the monitor to your backend's `GET /health` endpoint.
   - Configure email/SMS alerts so you are notified immediately if the app crashes.
2. **Error Tracking (Sentry)**
   - Create a free account at [sentry.io](https://sentry.io).
   - Create two projects (one for Express/Node.js, one for React).
   - Add the resulting DSN keys to your platform's environment variables (`SENTRY_DSN` and `VITE_SENTRY_DSN`). The app will automatically initialize Sentry if these keys are present.
3. **Database Backups**
   - Ensure your database provider (e.g., Supabase, PlanetScale, AWS RDS) has automated backups enabled. Many "free tier" providers do not enable this by default. Check their documentation and configure a daily backup schedule.
4. **HTTPS Enforcement**
   - Verify that your hosting provider (Vercel, Render, Railway, etc.) automatically redirects HTTP traffic to HTTPS and provisions an SSL certificate (Let's Encrypt). This is usually the default behavior.

## Documentation

The `docs/` folder contains the project's canonical documentation. Quick links and short descriptions:

- [docs/getting-started.md](docs/getting-started.md) — Step-by-step setup, development and production run instructions.
- [docs/architecture.md](docs/architecture.md) — High-level system architecture, components, and data flow diagrams.
- [docs/backend.md](docs/backend.md) — Backend structure, controllers, routes, middleware and important implementation notes.
- [docs/api.md](docs/api.md) — API contract and endpoint reference used by the frontend and third-party clients.
- [docs/database.md](docs/database.md) — Database schema, table descriptions, and sample queries used by the project.
- [docs/deployment.md](docs/deployment.md) — Deployment guides for staging and production, environment considerations and commands.
- [docs/tech-stack.md](docs/tech-stack.md) — Libraries, frameworks, build tooling, and runtime versions used across the project.
- [docs/decisions.md](docs/decisions.md) — Key architectural and implementation decisions, tradeoffs and alternatives considered.
- [docs/README.md](docs/README.md) — Overview index for the `docs/` directory with quick navigation.

## Troubleshooting

- If the client build fails with Tailwind/PostCSS errors (recent Tailwind v4 changes), try installing client deps with legacy peer-deps:

```bash
cd client
npm install --legacy-peer-deps
```

- If problems persist, pin `tailwindcss` to a v3 compatible release:

```bash
npm install tailwindcss@^3 --save-dev --legacy-peer-deps
```

- Backend requires `GEMINI_API_KEY` for resume analysis; the app starts without the key but analysis features will be disabled.

## Useful commands

- Install only server deps:

```bash
npm ci --prefix server
```

- Install only client deps (use legacy peer deps if needed):

```bash
npm install --prefix client --legacy-peer-deps
```
