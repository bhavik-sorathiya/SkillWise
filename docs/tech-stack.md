# Tech Stack

## Frontend
### React 19
- Why: component-based UI with hooks and strong ecosystem.
- Where: `client/src/*`

### Vite
- Why: fast local dev server and optimized production builds.
- Where: frontend tooling (`client/package.json`, Vite config)

### Tailwind CSS
- Why: utility-first styling for rapid consistent UI development.
- Where: frontend styles/classes (`client/src/*.jsx`, Tailwind config)

### Socket.IO Client
- Why: real-time bi-directional communication for live interview chat.
- Where: `client/src/services/socketService.js`

## Backend
### Node.js + Express
- Why: lightweight HTTP API and middleware-based architecture.
- Where: `server/index.js`, `server/src/routes/*`

### Socket.IO
- Why: low-latency event transport for interview session messaging.
- Where: `server/index.js`, `server/src/handlers/interviewHandler.js`

### MySQL (`mysql2`)
- Why: relational storage with SQL joins for sessions/history and auth data.
- Where: `server/src/config/db.js`, model/query layers

### JWT (`jsonwebtoken`)
- Why: stateless authentication for protected routes.
- Where: `server/src/controllers/authController.js`, `server/src/middleware/authMiddleware.js`

### bcryptjs
- Why: secure password hashing.
- Where: `server/src/controllers/authController.js`

### multer
- Why: multipart file handling for resume upload.
- Where: `server/src/routes/resumeRoutes.js`

### mammoth
- Why: DOCX-to-text extraction before AI analysis.
- Where: `server/src/utils/resumeParser.js`

### Joi
- Why: schema validation for AI responses and safer persistence.
- Where: `server/src/utils/responseValidator.js`

## AI Integration
### Google Gemini (`@google/generative-ai`)
- Why: resume analysis and interview evaluation/question generation.
- Where: `server/src/utils/geminiService.js`, `server/src/utils/interviewAI.js`

## Dev Tooling
### nodemon
- Why: backend auto-reload in development.
- Where: `server/package.json`

### concurrently
- Why: run frontend + backend from root in one command.
- Where: root `package.json` scripts

### ESLint
- Why: code-quality/static checks for frontend.
- Where: `client/eslint.config.js`