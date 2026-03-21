# Backend

## Overview
Backend runtime: `Node.js + Express + Socket.IO + MySQL`

Entry point:
- `server/index.js`

Primary responsibilities:
- Authentication (signup/login/logout)
- Resume upload + AI analysis pipeline
- Skills CRUD + profile sync
- Interview dashboard data
- Interview history APIs
- Live interview socket orchestration

## Folder Structure
```text
server/
  index.js
  package.json
  src/
    config/
      db.js
    controllers/
      authController.js
      intervieweeDashboardController.js
      resumeController.js
      skillsController.js
    handlers/
      interviewHandler.js
    middleware/
      authMiddleware.js
    models/
      interviewModel.js
      resumeAnalysisModel.js
      userModel.js
      userProfileModel.js
      userResumeModel.js
    routes/
      authRoutes.js
      intervieweeDashboardRoutes.js
      interviewHistoryRoutes.js
      resumeRoutes.js
      skillsRoutes.js
    utils/
      contextBuilder.js
      errorHandler.js
      geminiService.js
      interviewAI.js
      interviewUtils.js
      promptGenerator.js
      responseParser.js
      responseValidator.js
      resumeParser.js
      resumeSummarizer.js
```

## Services / Controllers
### Auth
- `authController.js`
  - `signup`: validates inputs, hashes password, creates user
  - `login`: verifies credentials, returns JWT + user payload
  - `logout`: stateless confirmation endpoint

### Resume
- `resumeController.js`
  - `getResumesList`: list user resumes with metadata
  - `uploadResume`: validate DOCX, store file, parse text, invoke Gemini, store analysis
  - `getResumeAnalysis`: fetch one resume analysis by id

### Skills
- `skillsController.js`
  - `getSkills`: fetch profile skills
  - `addSkill`, `updateSkill`, `deleteSkill`: mutate profile JSON and sync latest analysis

### Interviewee dashboard
- `intervieweeDashboardController.js`
  - `getDashboardData`: aggregate user/profile dashboard response
  - `getResumeAnalysisData`: endpoint currently returning placeholder/static-style response

### Interview history
- Route-level handlers in `interviewHistoryRoutes.js`
  - list sessions with pagination/sort
  - fetch session detail with evaluations + parsed result JSON

### Real-time interview service
- `handlers/interviewHandler.js`
  - Socket events: `start_interview`, `user_message`, `end_interview`
  - Persists messages/evaluations/results
  - Uses AI helpers for next-question and final-verdict generation

## Business Logic Overview
### Auth logic
- Passwords hashed with bcrypt
- JWT signed with `JWT_SECRET`
- Protected APIs require `Authorization: Bearer <token>`

### Resume analysis logic
- Only DOCX accepted
- Max upload size: 3MB
- Max resumes per user: 3
- Resume text extracted with Mammoth
- Gemini prompts enforce structured JSON output
- Joi validation ensures schema-safe analysis storage

### Skills logic
- Skills stored in `user_profiles.profile_data` JSON
- Mutations also sync to latest `resume_analysis` record (when present)

### Interview logic
- Session lifecycle persisted in DB tables
- AI responses validated, with fallback values on parse/AI errors
- Early-stop and redundancy checks reduce repetitive interview loops

## Error Handling
- Async route handlers wrapped with `catchAsync`
- Centralized `globalErrorHandler`
- Structured HTTP status handling (400/401/403/404/409/500)
- Socket channel emits structured `error` events for client notification