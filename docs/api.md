# API

Base URL (default local):
- `http://localhost:3000/api`

Auth model:
- JWT bearer token for protected HTTP routes
- Header: `Authorization: Bearer <token>`

Response pattern:
- Success: `{ success: true, ... }`
- Error: `{ success: false, message|error, ... }`

## Auth Endpoints
### POST `/auth/signup`
Creates a new user.

Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

Response (201):
```json
{
  "success": true,
  "message": "User created successfully. You can now login.",
  "userId": 10
}
```

### POST `/auth/login`
Authenticates user and returns JWT.

Request:
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 10,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "created_at": "2026-03-22T12:00:00.000Z"
  },
  "token": "<jwt>"
}
```

### POST `/auth/logout` (protected)
Stateless logout acknowledgement.

## Interviewee Endpoints
### GET `/interviewee/dashboard` (protected)
Returns dashboard user/profile data.

### GET `/interviewee/resume-analysis` (protected)
Returns resume analysis payload used by dashboard flow.

## Resume Endpoints
### GET `/resumes/list` (protected)
List current user resumes.

Response example:
```json
{
  "success": true,
  "data": {
    "resumes": [
      {
        "id": 4,
        "name": "4_John_resume_1.docx",
        "uploadedDate": "1 day ago",
        "type": "docx",
        "uploadedAt": "2026-03-21T12:00:00.000Z",
        "isPrimary": true
      }
    ],
    "total": 1,
    "maxAllowed": 3,
    "canUpload": true
  }
}
```

### POST `/resumes/upload` (protected)
Upload DOCX and trigger analysis.

Constraints:
- File field: `file`
- MIME: DOCX only
- Max size: 3MB

Request (multipart form-data):
- `file`: `resume.docx`
- `targetRole`: `Frontend Developer`

Response (201) example:
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "id": 12,
    "name": "12_Jane_resume_1.docx",
    "uploadedDate": "Just now",
    "type": "docx",
    "analysisMetadata": {
      "attempted": true,
      "success": true,
      "analysisId": 33
    }
  }
}
```

### GET `/resumes/analysis/:resumeId` (protected)
Returns full structured analysis for a resume.

## Skills Endpoints (all protected)
### GET `/skills`
Returns profile skills.

### POST `/skills/add`
Request:
```json
{
  "skill_name": "React",
  "proficiency_level": "intermediate",
  "years_of_experience": 1
}
```

### PUT `/skills/:skillName`
Request example:
```json
{
  "new_skill_name": "React.js",
  "proficiency_level": "advanced"
}
```

### DELETE `/skills/:skillName`
Removes skill from profile and latest analysis copy.

## Interview History Endpoints (protected)
### GET `/interviews?limit=10&offset=0&sortBy=date&sortOrder=desc`
Returns paginated session list.

### GET `/interviews/user/:userId?limit=10&offset=0&sortBy=score&sortOrder=asc`
Same as list endpoint but enforces owner-only access.

### GET `/interviews/session/:sessionId`
Returns one session detail with stats, evaluations, confidence series, and parsed final analysis.

## Socket.IO API (Live Interview)
Connection:
- URL: backend host (`http://localhost:3000`)
- Handshake auth payload includes `token` and `userId`

Client -> Server events:
- `start_interview`: `{ resumeId, role }`
- `user_message`: `{ sessionId, message }`
- `end_interview`: `{ sessionId }`

Server -> Client events:
- `ai_message`: next question / system transition message
- `loading`: progress state (`Evaluating your answer...`, etc.)
- `interview_closing`: indicates finalization stage
- `interview_result`: final verdict payload
- `error`: structured error payload

## Auth Details
- Token signing secret: `JWT_SECRET`
- HTTP protected routes use middleware verification
- 401 responses for missing/invalid/expired tokens
- Ownership checks prevent cross-user interview history access