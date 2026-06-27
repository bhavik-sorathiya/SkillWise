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
- Uploads the physical file buffer directly to **Supabase Cloud Storage** to avoid local disk clutter and ensure scalability.
- Extracts raw text using `mammoth` or `pdf-parse`, preparing it for the AI engine.

### 2. AI Integration & Retry Engine
- Housed in `utils/geminiService.js`.
- Communicates directly with Google's Gemini Models.
- **Resilience Mechanism (3-Tier Fallback)**: The Gemini service strictly manages quota limits using a 3-tier fallback loop:
  1. If a `429 Too Many Requests` or `RESOURCE_EXHAUSTED` error occurs on `GEMINI_API_KEY`, it retries once.
  2. If the primary key fails 2 times, it smoothly falls back to a secondary system key (`GEMINI_API_KEY_2`) and attempts up to 2 times.
  3. If both system keys are exhausted, the controllers intercept the failure and automatically load the user's personal API key (Bring Your Own Key) from the database to ensure zero interruption.

### 3. Real-Time Interview Engine
- Orchestrated in `handlers/interviewHandler.js`.
- Maintains the state machine of an active mock interview over WebSockets.
- Triggers AI evaluations on every user answer and persists the dialogue immediately to MySQL to ensure no data is lost if the socket drops.

### 4. Daily Usage Tracking
- Orchestrated via `utils/usageTracker.js`.
- Provides a freemium safeguard by strictly limiting the number of AI operations (1 free resume analysis, 1 free mock interview per day).
- To ensure fairness, limits are *only* deducted upon successful AI analysis (e.g., if a resume parsing fails, or an interview crashes before the first question is answered, the user retains their free usage limit).

### 5. Structured Error Handling & Logging
- **Winston Logger** (`utils/logger.js`): Replaces raw console logs. Outputs human-readable colored logs in development, and switches to structured JSON logs written to daily rotating files (`logs/`) in production.
- **Global Error Handler** (`utils/errorHandler.js`): A centralized Express middleware. It guarantees that uncaught exceptions never leak server stack traces to the client in production, while formatting errors consistently.
- **Sentry Integration**: Tied in right before the global error handler (`Sentry.setupExpressErrorHandler(app)`), ensuring that any crash is documented with full context in your Sentry dashboard.

---
[⬅ Previous Page: Database](database.md) | [🏠 Documentation Index](README.md) | [Next Page: API Contract ➡](api.md)