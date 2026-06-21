# Deployment & DevOps

SkillWise is designed to be deployed as a decoupled system: a static frontend and a stateful Node.js backend. 

## Suggested Hosting Split
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront. (Static Hosting).
- **Backend**: Render, Railway, DigitalOcean App Platform, or a traditional VM (e.g., EC2) using PM2.
- **Database**: Managed MySQL (e.g., PlanetScale, AWS RDS, Supabase).

This split is the recommended default because it keeps the frontend globally distributed on an edge CDN, while the backend maintains strict control over the API, Socket.IO connections, and database scaling.

---

## The Pre-Flight Checklist

Before taking the application live to real users, ensure you have completed the following infrastructure configurations:

### 1. Observability
- **Sentry Integration**: Create a free account at [sentry.io](https://sentry.io). Obtain a Node.js DSN and a React DSN. Add them to your environment variables as `SENTRY_DSN` and `VITE_SENTRY_DSN`. This will automatically activate error tracking and stack trace capture.
- **Uptime Monitoring**: Configure a service like UptimeRobot to ping your `GET /health` endpoint every 5 minutes. (Note: The backend also runs an internal 10-minute self-ping to prevent free-tier hosting cold starts).

### 2. Security & Compliance
- **Disable Frontend Sourcemaps**: Already configured in `client/vite.config.js`. This ensures your raw source code is not exposed to the public.
- **CORS Configuration**: In your backend hosting provider, set the `ALLOWED_ORIGINS` environment variable to your exact production frontend URL (e.g., `https://skillwise.example.com`). Do not use a wildcard `*` in production.
- **HTTPS**: Ensure your reverse proxy or hosting provider is terminating SSL and redirecting HTTP traffic to HTTPS.

### 3. Data Persistence
- **Database Backups**: Verify that your managed MySQL provider has automated daily backups enabled.
- **File Uploads**: The backend requires a writable filesystem to temporarily store resumes. If you are deploying to a serverless or ephemeral environment (where files are lost on restart), you must map the `server/uploads/resumes` directory to a persistent volume, or adapt the `multer` config to pipe directly to an S3 bucket.

---

## Continuous Integration (CI/CD)

The repository includes a GitHub Actions workflow (`.github/workflows/build.yml`). 
On every push to the `main` branch, the pipeline automatically:
1. Provisions a Node 20 environment.
2. Installs dependencies for both client and server.
3. Builds the React application to ensure no syntax errors break the UI.
4. Runs a syntax check (`node --check`) against the Express server.

This guarantees that fundamentally broken code never reaches your deployment pipeline.

---

## Build & Run Commands

### Frontend Build
```bash
cd client
npm install --legacy-peer-deps
npm run build
```
The resulting `client/dist` folder can be served by any static web server (Nginx, Vercel).

### Backend Run
```bash
cd server
npm install
npm run start
```
*If deploying to a raw VM (not a managed platform like Render), it is highly recommended to use a process manager like PM2:*
```bash
npm install -g pm2
pm2 start index.js --name "skillwise-api"
```

---
[⬅ Previous Page: API Contract](api.md) | [🏠 Documentation Index](README.md) | [Next Page: Architectural Decisions ➡](decisions.md)