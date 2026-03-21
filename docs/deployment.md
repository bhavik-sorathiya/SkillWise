# Deployment

## Deployment Model
Current setup is designed for local/dev first, and can be deployed as:
- Frontend static app (Vite build output)
- Backend Node server (Express + Socket.IO)
- MySQL database service

## Environment Variables
Backend (`server/.env`):
- `PORT` (default `3000`)
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE`
- `JWT_SECRET`
- `GEMINI_API_KEY` or `GEMINI_API_KEY_1`
- `GEMINI_API_KEY_2` (optional fallback)
- `RESUME_ANALYSIS_TIMEOUT` (optional, default 30000 ms)
- `NODE_ENV` (`development|production`)

Frontend (`client/.env`):
- `VITE_API_URL` (default `http://localhost:3000/api`)
- `VITE_SOCKET_URL` (default `http://localhost:3000`)

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
For production, prefer process manager (PM2/systemd/container).

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

## Common Deployment Pitfalls
- Socket CORS mismatch between frontend URL and backend config.
- Missing writable `uploads/resumes` directory.
- Missing env vars causing startup or auth failures.
- Different API base URL in frontend build vs runtime expectation.