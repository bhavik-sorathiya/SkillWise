# Technology Stack

SkillWise is built using a modern, robust JavaScript ecosystem. This document outlines the core technologies and the rationale behind their selection.

## Frontend (Client)

### React 19
- **Why**: Component-based UI with hooks and a massive, stable ecosystem.
- **Where**: `client/src/*`

### Vite
- **Why**: Extremely fast local development server with Hot Module Replacement (HMR) and optimized Rollup production builds.
- **Where**: Frontend build tooling (`client/vite.config.js`).

### Tailwind CSS
- **Why**: Utility-first styling allowing for rapid, consistent, and responsive UI development without context-switching to CSS files.
- **Where**: Embedded directly in components (`client/src/*.jsx`).

### Socket.IO Client
- **Why**: Real-time, bi-directional event transport critical for the live mock interview chat interface.
- **Where**: `client/src/services/socketService.js`

### Sentry React (`@sentry/react`)
- **Why**: Captures unhandled React exceptions, promise rejections, and provides Session Replays for production debugging.
- **Where**: `client/src/main.jsx`

---

## Backend (Server)

### Node.js + Express
- **Why**: Lightweight, asynchronous HTTP API framework utilizing a familiar middleware-based architecture.
- **Where**: `server/index.js`, `server/src/routes/*`

### MySQL (`mysql2`)
- **Why**: Relational storage offering strict ACID compliance and SQL joins—ideal for linking users to their historical interview sessions and resumes.
- **Where**: `server/src/config/db.js`

### Security & Resilience
- **`helmet`**: Automatically sets ~15 HTTP security headers to protect against common web vulnerabilities (XSS, clickjacking).
- **`express-rate-limit`**: Protects the API from brute-force login attempts and limits costly AI invocations.
- **`jsonwebtoken` (JWT)**: Stateless authentication for verifying protected REST API routes and securing Socket.IO handshakes.
- **`bcryptjs`**: Industry-standard secure password hashing.

### Observability
- **Winston (`winston`)**: Professional structured logging framework, configured to output JSON logs and handle automatic daily file rotation (`winston-daily-rotate-file`).
- **Sentry Node (`@sentry/node`)**: Server-side error tracking and Node.js profiling. Captures stack traces before the process crashes.

### Document Processing
- **`multer`**: Handles multipart/form-data for resume uploads in memory.
- **`mammoth` & `pdf-parse`**: Extracts raw text from DOCX and PDF files respectively, making the text digestible for the AI engine.

---

## AI Engine

### Google Gemini (`@google/genai`)
- **Why**: Powers both the static resume analysis and the dynamic, context-aware mock interview generation.
- **Where**: `server/src/utils/geminiService.js`

---
[⬅ Previous Page: Architecture](architecture.md) | [🏠 Documentation Index](README.md) | [Next Page: Database Schema ➡](database.md)