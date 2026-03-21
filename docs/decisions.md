# Architectural Decisions

## 1. Modular Monolith Instead of Microservices
Decision:
- Keep one backend service with clear module boundaries.

Why:
- Faster iteration for current project scope.
- Lower ops complexity (single deploy/runtime).

Trade-off:
- Simpler now, but horizontal scaling and independent service evolution are limited.

## 2. Relational DB + JSON Hybrid Model
Decision:
- Use MySQL tables for core entities, and JSON columns for flexible AI payloads.

Why:
- Structured entities (users/sessions/messages) benefit from SQL.
- AI outputs vary; JSON avoids constant migration churn.

Trade-off:
- JSON fields are harder to index/query deeply than fully normalized schema.

## 3. JWT Stateless Authentication
Decision:
- Use bearer JWT tokens for protected APIs.

Why:
- Simple client-server auth model with no server-side session store.

Trade-off:
- Token revocation is harder without extra infrastructure.

## 4. Socket.IO for Live Interview Flow
Decision:
- Use event-based sockets for interview runtime, not polling REST.

Why:
- Better UX for real-time Q/A and status events.

Trade-off:
- More connection/state complexity vs pure HTTP flows.

## 5. Strict Validation Around AI Output
Decision:
- Validate/sanitize AI responses before DB writes and use fallbacks.

Why:
- Prevent malformed AI responses from breaking workflow or persistence.

Trade-off:
- Additional code complexity and maintenance for schemas/parsers.

## 6. File Upload Constraints (DOCX, 3MB, max 3 resumes)
Decision:
- Hard constraints enforced in route/controller logic.

Why:
- Controls storage, parsing reliability, and AI processing cost.

Trade-off:
- Restricts user flexibility (e.g., PDFs unsupported in upload flow).

## 7. Client-Side Lightweight Routing State
Decision:
- Use page-state mapping in `App.jsx` instead of React Router.

Why:
- Keeps routing simple for current number of pages and controlled nav flow.

Trade-off:
- Less conventional than router libraries; deep-linking patterns are more manual.

## 8. Keep Existing CORS Defaults for Local Dev
Decision:
- Allow localhost frontend origins explicitly in backend.

Why:
- Smooth local development without extra proxy setup.

Trade-off:
- Must be hardened for production deployment environments.