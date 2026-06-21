# SkillWise Engineering Handbook

Welcome to the technical documentation for SkillWise. This handbook is designed for developers, system architects, and technical recruiters to understand the underlying infrastructure, design decisions, and operational mechanics of the platform.

SkillWise is a production-ready application featuring robust error tracking, rate limiting, secure AI integrations, and real-time bidirectional communication.

## Reading Order

For the best experience, we recommend reading through these documents in the following order:

1. **[Getting Started](getting-started.md)**: Local environment setup, dependency management, and initial build instructions.
2. **[System Architecture](architecture.md)**: High-level overview of the components, data flow, and interaction diagrams.
3. **[Tech Stack](tech-stack.md)**: Deep dive into the libraries, frameworks, and tools powering the application.
4. **[Database Schema](database.md)**: MySQL tables, relationships, pooling configuration, and resilience tactics.
5. **[Backend Infrastructure](backend.md)**: Express routing, Winston structured logging, Socket.IO handlers, and Gemini AI retry logic.
6. **[API Contract](api.md)**: REST endpoint documentation, authentication layers, and rate limiting rules.
7. **[Deployment & DevOps](deployment.md)**: CI/CD pipelines, pre-launch checklists, Sentry observability, and environment configurations.
8. **[Architectural Decisions](decisions.md)**: A record of key trade-offs and design choices (e.g., why we chose standard CORS over proxies).

## Maintenance & Versioning

This documentation is treated as code. Whenever a database schema changes, an API endpoint is altered, or a new piece of infrastructure (like Sentry or Redis) is introduced, the relevant pages in this handbook must be updated in the same Pull Request.

---
[🏠 Documentation Index](README.md) | [Next Page: Getting Started ➡](getting-started.md)