# Architecture

## System Design
SkillWise uses a **modular monolith** architecture:
- One backend service (`Node.js + Express`) handles auth, resume analysis, skills, and interview history.
- One frontend SPA (`React + Vite`) handles UI, routing state, and API/socket communication.
- One relational database (`MySQL`) stores users, profiles, resumes, analysis, and interview sessions.
- One real-time channel (`Socket.IO`) supports live mock interview flows.

This is not a microservices architecture today. Boundaries are separated by folders/modules instead of separate deployable services.

## High-Level Interaction
```mermaid
flowchart LR
  U[User Browser]
  FE[React Frontend\nclient/]
  API[Express Backend\nserver/]
  DB[(MySQL)]
  AI[Gemini API]
  WS[Socket.IO]

  U --> FE
  FE -->|REST /api/*| API
  FE -->|Socket Events| WS
  WS --> API
  API --> DB
  API --> AI
  API --> WS
  WS --> FE
```

## Frontend -> Backend -> DB Flow
### Resume analysis flow
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant API as Backend
  participant DB as MySQL
  participant AI as Gemini

  FE->>API: POST /api/resumes/upload (DOCX + targetRole)
  API->>DB: INSERT user_resumes
  API->>API: Parse DOCX + validate text
  API->>AI: Analyze resume prompt
  AI-->>API: Structured JSON analysis
  API->>DB: INSERT resume_analysis
  API-->>FE: Upload + analysis metadata response
```

### Live interview flow
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant IO as Socket.IO
  participant API as Interview Handler
  participant DB as MySQL
  participant AI as Gemini

  FE->>IO: start_interview(resumeId, role)
  IO->>API: create session + seed first question
  API->>DB: INSERT interview_sessions/messages
  API-->>FE: ai_message

  loop per answer
    FE->>IO: user_message(sessionId, message)
    IO->>API: evaluate answer
    API->>DB: save message + evaluation
    API->>AI: next question/evaluation
    API-->>FE: ai_message or interview_closing
  end

  FE->>IO: end_interview(sessionId)
  IO->>API: finalize
  API->>AI: final evaluation
  API->>DB: save interview_results + close session
  API-->>FE: interview_result
```

## Internal Module Boundaries
- `server/src/routes/*`: HTTP route registration and middleware binding
- `server/src/controllers/*`: request orchestration and response shaping
- `server/src/models/*`: SQL/database access
- `server/src/utils/*`: parser/validator/AI helpers
- `server/src/handlers/interviewHandler.js`: socket event orchestration

## Communication Details
- REST for CRUD/data retrieval (`/api/auth`, `/api/resumes`, `/api/skills`, `/api/interviews`, `/api/interviewee`)
- Socket.IO for low-latency interview chat and evaluation events
- JWT bearer tokens for protected REST routes; token + user context for socket handshake

## Why this architecture
- Faster development and easier debugging for a student/mini-project scope
- Clear module boundaries without multi-service deployment overhead
- Supports both request-response and real-time workflows in one backend process