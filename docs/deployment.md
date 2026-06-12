# Deployment

## Deployment Model
Current setup is designed for local/dev first, and can be deployed as:
- Frontend static app (Vite build output)
- Backend Node server (Express + Socket.IO)
- MySQL database service

Recommended deployment approach:
- Deploy the frontend and backend separately on platforms that suit each runtime.
- Let the backend own API, auth, uploads, and Socket.IO.
- If you want a single-host demo, the backend can also serve `client/dist` in production after the frontend build.

## Environment Variables
Backend (`server/.env`):
- `PORT` (default `3000`)
- `CLIENT_URL` or `CLIENT_URLS`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_SSL` (`true|false`)
- `JWT_SECRET`
- `GEMINI_API_KEY` or `GEMINI_API_KEY_1`
- `GEMINI_API_KEY_2` (optional fallback)
- `RESUME_ANALYSIS_TIMEOUT` (optional, default 30000 ms)
- `NODE_ENV` (`development|production`)

Frontend (`client/.env`):
- `VITE_API_URL` (default `/api` in production, `http://localhost:3000/api` in development)
- `VITE_SOCKET_URL` (default same-origin in production, `http://localhost:3000` in development)
- `VITE_DEV_BACKEND_URL` (optional dev proxy target)
- `VITE_DEV_PORT` (optional dev server port)

## Build Steps
### Frontend
```bash
cd client
npm install
npm run build
```
Build output: `client/dist`

### Backend
```bash
cd server
npm install
npm run start
```
For production, use `npm run start` behind a process manager (PM2/systemd/container).

## Local Combined Run
From repo root:
```bash
npm run setup
npm run dev
```

## Production Checklist
1. Set secure `JWT_SECRET`.
2. Use production DB credentials (no defaults).
3. Restrict CORS origins in `server/index.js`.
4. Configure HTTPS/TLS at reverse proxy or platform layer.
5. Persist `uploads/` volume (resume files).
6. Ensure Gemini keys are configured and rotated securely.

## Suggested Hosting Split
- Frontend: Vercel/Netlify/static host
- Backend: Render/Railway/VM/container
- DB: Managed MySQL (PlanetScale/RDS/etc.)

This split is the recommended default because it keeps the frontend CDN-friendly while the backend owns the API, Socket.IO, and auth state.

## Common Deployment Pitfalls
- Socket CORS mismatch between frontend URL and backend config.
- Missing writable `uploads/resumes` directory.
- Missing env vars causing startup or auth failures.
- Different API base URL in frontend build vs runtime expectation.