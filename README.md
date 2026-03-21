# SkillWise

SkillWise is a full-stack web application: a React (Vite) frontend and a Node.js + Express backend with MySQL and Socket.IO for real-time mock interviews & resume analysis.

This README covers quick setup, run commands, required environment variables, documentation links and a short troubleshooting section.

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

Frontend (`client/.env`):

- `VITE_API_URL` (e.g. `http://localhost:3000/api`)
- `VITE_SOCKET_URL` (e.g. `http://localhost:3000`)

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

Open any of the files above for more detailed guidance. If you want, I can expand any single doc into a fuller how-to or add examples (database seed scripts, deployment CI, etc.).

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

## Next steps

- Read `docs/getting-started.md` and `docs/architecture.md` for a deeper walkthrough.
- Want me to: run the setup now, or pin `tailwindcss` to v3 and rebuild the client? Reply which action you prefer and I'll proceed.
