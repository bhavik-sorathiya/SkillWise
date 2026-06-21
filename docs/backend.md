# Backend Infrastructure

The SkillWise backend is an Express-based Node.js application. It is responsible for all heavy lifting: authentication, document parsing, database orchestration, AI invocation, and real-time state management.

## Entry Point: `server/index.js`
This file bootstraps the entire application. It sets up:
1. **Observability**: Initializes Sentry for error tracking and performance profiling.
2. **Security Middlewares**: `helmet`, `compression`, and `cors`.
3. **Rate Limiting**: Instantiates specific strict limiters for authentication and AI routes to prevent abuse.
4. **Parsers**: JSON and URL-encoded payload parsers.
5. **Route Registration**: Binds API routes to specific domain prefixes (`/api/auth`, `/api/resumes`, etc.).
6. **Socket.IO Integration**: Mounts the WebSocket engine to the HTTP server for real-time capabilities.
7. **Graceful Shutdown**: Listens for process signals (`SIGTERM`) to cleanly close server connections and database pools.

## Directory Structure

```text
server/
  index.js
  src/
    config/         # Database and third-party configuration
    controllers/    # Request orchestration and response mapping
    handlers/       # Socket.IO event handlers
    middleware/     # Auth, error, and logging middlewares
    models/         # Database access layer (Queries)
    routes/         # Express route definitions
    utils/          # Helpers (AI Services, Doc Parsers, Validators, Logger)
```

## Key Subsystems

### 1. Document Parsing Pipeline
- Handled primarily by `resumeController.js` and `utils/resumeParser.js`.
- Uses `multer` configured for memory storage to intercept file uploads.
- Validates the MIME type (DOCX/PDF) and file size (max 3MB).
- Extracts raw text using `mammoth` or `pdf-parse`, preparing it for the AI engine.

### 2. AI Integration & Retry Engine
- Housed in `utils/geminiService.js`.
- Communicates directly with Google's Gemini Models.
- **Resilience Mechanism**: The Gemini service is wrapped in an intelligent, exponential backoff loop.
  - If a `429 Too Many Requests` or `RESOURCE_EXHAUSTED` error occurs, the system catches it.
  - It pauses (e.g., 1s, then 2s) and retries the request automatically.
  - If the primary API key is fully exhausted after multiple attempts, it seamlessly falls back to `GEMINI_API_KEY_2` if configured.

### 3. Real-Time Interview Engine
- Orchestrated in `handlers/interviewHandler.js`.
- Maintains the state machine of an active mock interview over WebSockets.
- Triggers AI evaluations on every user answer and persists the dialogue immediately to MySQL to ensure no data is lost if the socket drops.

### 4. Structured Error Handling & Logging
- **Winston Logger** (`utils/logger.js`): Replaces raw console logs. Outputs human-readable colored logs in development, and switches to structured JSON logs written to daily rotating files (`logs/`) in production.
- **Global Error Handler** (`utils/errorHandler.js`): A centralized Express middleware. It guarantees that uncaught exceptions never leak server stack traces to the client in production, while formatting errors consistently.
- **Sentry Integration**: Tied in right before the global error handler (`Sentry.setupExpressErrorHandler(app)`), ensuring that any crash is documented with full context in your Sentry dashboard.

---
[⬅ Previous Page: Database](database.md) | [🏠 Documentation Index](README.md) | [Next Page: API Contract ➡](api.md)