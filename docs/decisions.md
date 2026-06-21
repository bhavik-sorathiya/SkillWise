# Architectural Decisions

This document acts as an Architecture Decision Record (ADR), detailing the *why* behind our core engineering choices.

## 1. Modular Monolith Over Microservices
**Decision:** We chose a single Node.js/Express backend over split microservices.
**Why:** Faster iteration, lower operational complexity, and simpler deployment.
**Trade-off:** Independent horizontal scaling of specific features (e.g., separating the heavy AI analysis from simple CRUD tasks) is not possible without refactoring.

## 2. Hybrid Database Schema (SQL + JSON)
**Decision:** We use standard MySQL tables (`users`, `interview_sessions`) but rely heavily on JSON columns for AI responses (`profile_data`, `analysis_data`).
**Why:** The AI prompt outputs are subject to frequent change as we tune the models. JSON columns prevent the need for continuous schema migrations.
**Trade-off:** Deep querying inside the JSON structures is slower and less efficient than querying fully normalized tables.

## 3. Explicit CORS Environment Variables (Proxy-less)
**Decision:** We removed the Vite development proxy. CORS is strictly handled by the Express backend using an `ALLOWED_ORIGINS` array.
**Why:** Proxies obscure the actual network request origins. By enforcing explicit CORS arrays on the backend, the local development environment perfectly mirrors the strict production security environment.
**Trade-off:** Requires setting explicit frontend URLs in the backend's `.env` file upon deployment.

## 4. Exponential Backoff for Gemini API
**Decision:** The `geminiService` intercepts `429 Too Many Requests` errors and automatically retries with exponential backoff before failing.
**Why:** External AI APIs are volatile. A momentary quota hiccup shouldn't instantly crash a user's mock interview.
**Trade-off:** If the API is truly down, the request will hang slightly longer before returning a failure to the client.

## 5. Strict API Rate Limiting
**Decision:** We enforce a global rate limit, a strict Auth rate limit (15 req/15 min), and a strict AI rate limit (10 req/15 min).
**Why:** AI endpoint invocations are financially expensive and computationally heavy. Without limits, a malicious user could drain the Gemini API quota in minutes.
**Trade-off:** Legitimate power users testing multiple resumes rapidly might hit the limit.

## 6. Socket.IO for Live Interview Flow
**Decision:** We use event-based WebSockets for the interview runtime instead of polling a REST API.
**Why:** Sub-second latency is required for a natural "chat" feel. WebSockets allow the server to push updates (`ai_message`, `loading` states) instantaneously.
**Trade-off:** WebSockets require stateful sticky sessions on load balancers, making zero-downtime deployments slightly more complex.

## 7. JWT Stateless Authentication
**Decision:** We use bearer JWT tokens for protected APIs without storing session IDs in a database or Redis.
**Why:** Extremely simple implementation that scales effortlessly across multiple Express worker nodes.
**Trade-off:** Immediate token revocation (e.g., forced logout) is difficult to implement without introducing a database-backed denylist.

---
[⬅ Previous Page: Deployment](deployment.md) | [🏠 Documentation Index](README.md)