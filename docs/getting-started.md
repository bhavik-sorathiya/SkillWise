# Getting Started

## Prerequisites
- Node.js 18+
- npm 9+
- MySQL 8+
- Gemini API key(s)

## Run Project Locally
From root:
```bash
npm run setup
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## One-Time Database Setup
1. Create database and tables using `dbQueries.sql`.
2. Ensure backend `.env` points to the same database.

## Project Structure Walkthrough
```text
SkillWise/
  client/        # React app (UI, state, API/socket clients)
  server/        # Express API + Socket.IO + business logic
  docs/          # Canonical documentation set
  dbQueries.sql  # Schema + seed/reference SQL
```

Where major logic lives:
- UI routing/composition: `client/src/App.jsx`
- Interview chat page: `client/src/MockInterviewChat.jsx`
- Interview history page: `client/src/components/InterviewHistory.jsx`
- API client: `client/src/services/api.js`
- Socket client: `client/src/services/socketService.js`
- Backend entry: `server/index.js`
- Socket interview engine: `server/src/handlers/interviewHandler.js`

## Common Pitfalls
- Backend port mismatch (frontend expects backend at port `3000` unless overridden).
- Missing JWT secret or DB env values.
- Resume uploads fail if file is not DOCX or > 3MB.
- Live interview fails if socket URL or CORS origins are not aligned.
- Missing `uploads/resumes` write permission in some environments.

## Where to Start Reading Code
Recommended order:
1. `server/index.js` (runtime wiring)
2. `server/src/routes/*` (API boundaries)
3. `server/src/controllers/*` (request flows)
4. `server/src/handlers/interviewHandler.js` (socket flow)
5. `client/src/App.jsx` (frontend page orchestration)
6. `client/src/services/api.js` + `socketService.js` (integration layer)

## Quick Validation
- Run `npm run build` in `client/` to validate frontend compile.
- Start backend and test `GET /` returns `Welcome to SkillWise API`.
- Login from UI, then verify protected endpoints work with token.