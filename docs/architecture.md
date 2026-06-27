# System Architecture

SkillWise utilizes a **Modular Monolith** architectural pattern. This design provides the simplicity of a single deployable unit while maintaining strict internal boundaries for future scalability.

## High-Level Topology

- **Frontend Application**: A Single Page Application (SPA) built with React and Vite. It handles client-side routing, local state management, and visual representation.
- **Backend Service**: A Node.js + Express server. It manages REST API routes, Socket.IO connections, business logic, and acts as the secure intermediary for external APIs.
- **Relational Database**: A MySQL instance storing user identities, session data, resume metadata, and historical analysis.
- **AI Engine Integration**: Google's Gemini API, invoked securely from the backend to process natural language tasks.

## Data Flow Diagram

```mermaid
flowchart LR
  U[User Browser]
  FE[React Frontend\nclient/]
  API[Express Backend\nserver/]
  DB[(MySQL)]
  AI[Gemini API]
  WS[Socket.IO]
  CLOUD[Supabase Storage]

  U -->|Interacts| FE
  FE -->|REST HTTPS| API
  FE -->|WebSocket| WS
  WS --> API
  API -->|SQL Queries| DB
  API -->|Secure RPC| AI
  API -->|Upload File| CLOUD
  API -->|Emit| WS
  WS -->|Listen| FE
```

## Core Interaction Flows

### 1. The Resume Analysis Pipeline
When a user uploads a resume, the data follows a linear, synchronous flow:

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as Backend
  participant DB as MySQL
  participant CLOUD as Supabase
  participant AI as Gemini

  FE->>API: POST /api/resumes/upload (DOCX/PDF)
  API->>DB: Check Usage Limit
  API->>CLOUD: Upload physical file
  API->>DB: INSERT into user_resumes
  API->>API: Parse Document & Extract Text
  API->>AI: Send prompt with extracted text
  Note right of API: 3-Tier Fallback & Retry Logic active
  AI-->>API: Return structured JSON analysis
  API->>DB: INSERT into resume_analysis
  API-->>FE: Return 200 OK + Analysis JSON
```

### 2. The Real-Time Mock Interview Loop
Mock interviews require stateful, bidirectional communication. We use WebSockets (via Socket.IO) to achieve sub-second latency.

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant IO as Socket.IO
  participant API as Interview Engine
  participant DB as MySQL
  participant AI as Gemini

  FE->>IO: emit: start_interview(resumeId, role)
  IO->>API: Initialize session
  API->>DB: Create interview_sessions record
  API-->>FE: emit: ai_message (First Question)

  loop Answer & Evaluation Cycle
    FE->>IO: emit: user_message(answer)
    IO->>API: Process Answer
    API->>AI: Evaluate answer & generate next question
    API->>DB: Save dialogue turn
    API-->>FE: emit: ai_message
  end

  FE->>IO: emit: end_interview
  IO->>API: Finalize Session
  API->>AI: Generate aggregate feedback
  API->>DB: Update interview_sessions with final score
  API-->>FE: emit: interview_result
```

## Architectural Resilience & Security

SkillWise is designed to fail gracefully and recover automatically:

- **AI Fault Tolerance & 3-Tier Fallback**: The `geminiService` implements a strict fallback algorithm to handle rate limits and quotas:
  1. **Primary Key**: Uses `GEMINI_API_KEY` (2 attempts max).
  2. **Secondary Key**: If the primary key hits a rate limit (e.g. `429`), it falls back to `GEMINI_API_KEY_2` (2 attempts max).
  3. **User Key (BYOK)**: If both system keys fail or the user has exhausted their free daily limits, it safely fetches their encrypted personal API key from the database and uses it (2 attempts max).
- **Daily Limit Enforcement**: `usageTracker.js` tracks daily operations. Limit tracking operates safely—a limit is only deducted if an interview actually progresses (`total_questions > 0`) or if a resume analysis successfully completes.
- **Role-Based Access Control (RBAC)**: All user identities carry a `role` (`user` vs `admin`). Core API functions enforce these roles tightly, giving admins unique views into performance without resorting to hardcoded backdoors.
- **Database Connection Pooling**: The MySQL connection utilizes a managed pool with a strict `connectTimeout` to prevent the Node.js event loop from hanging during database outages.
- **Application Hardening**:
  - `helmet`: Injects critical HTTP security headers.
  - `express-rate-limit`: Prevents brute-force attacks on Auth routes and stops abuse of expensive AI endpoints.
- **Graceful Shutdown**: Upon receiving `SIGTERM` (during a deploy or scale event), the server stops accepting new connections and explicitly drains the database pool before exiting.

---
[⬅ Previous Page: Getting Started](getting-started.md) | [🏠 Documentation Index](README.md) | [Next Page: Tech Stack ➡](tech-stack.md)