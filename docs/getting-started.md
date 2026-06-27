# Getting Started

This guide covers everything you need to know to get the SkillWise application running on your local machine for development and testing.

## Prerequisites

Before cloning the repository, ensure your environment meets the following specifications:
- **Node.js**: v18.0.0 or higher.
- **npm**: v9.0.0 or higher.
- **MySQL**: v8.0 or higher (or a compatible cloud instance like PlanetScale).
- **API Keys**: You will need a Google Gemini API Key.
- **Supabase Account**: You will need a Supabase project for cloud storage of uploaded resumes.

## Initial Setup

1. **Clone the repository** and navigate to the project root:
   ```bash
   git clone <repository_url>
   cd SkillWise
   ```

2. **Install all dependencies** (this installs packages for both the `client` and `server` directories):
   ```bash
   npm run setup
   ```

## Environment Configuration

The application requires two `.env` files.

### 1. Backend (`server/.env`)
Create a file at `server/.env` with the following variables:
```env
# Server Config
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=skillwise
DB_PORT=3306

# Authentication
JWT_SECRET=your_super_secret_jwt_string

# AI Integration
GEMINI_API_KEY=your_google_gemini_key
GEMINI_API_KEY_2=your_secondary_gemini_key_for_fallback

# Cloud Storage
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Observability (Optional)
SENTRY_DSN=your_sentry_dsn
```

### 2. Frontend (`client/.env`)
Create a file at `client/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# Observability (Optional)
VITE_SENTRY_DSN=your_sentry_dsn
```

## Database Initialization

SkillWise requires a relational database. You can find the canonical SQL schema in the root directory.

1. Create an empty database in MySQL named `skillwise`.
2. Import the `dbQueries.sql` script to create all necessary tables and constraints.
3. Verify that your `server/.env` credentials match this local database.

## Running the Application Locally

To start both the Vite React frontend and the Express backend simultaneously:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

### Running Independently
If you need to debug a specific layer, you can run them in isolation:
- Frontend only: `npm run client`
- Backend only: `npm run server`

## Common Local Pitfalls

- **Port Conflicts**: Ensure port `3000` and `5173` are not being used by other applications.
- **Missing Sentry DSNs**: If `SENTRY_DSN` is empty, the application will still boot successfully. Sentry initialization is safely bypassed in local development if omitted.
- **WebSocket Drops**: Ensure `VITE_SOCKET_URL` strictly points to the backend port without trailing slashes.
- **Upload Failures**: Resume uploads will fail if the file exceeds 3MB, or if your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are incorrectly configured in `.env`.

---
[⬅ Index](README.md) | [🏠 Documentation Index](README.md) | [Next Page: System Architecture ➡](architecture.md)