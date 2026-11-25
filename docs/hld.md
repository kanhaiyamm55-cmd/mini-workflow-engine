# High-Level Design — Mini Workflow Engine
## Context
A single-user browser application for creating, updating, filtering and tracking tasks. Authentication, multi-user collaboration, queues and external integrations are out of scope. Task writes and their activity events must commit atomically.
## System interaction flow
```mermaid
flowchart LR
 Browser[Browser UI] -->|HTTP JSON| API[Express API]
 API -->|validated commands| Service[Task service]
 Service -->|parameterized SQL| DB[(SQLite)]
 DB -->|task rows and events| Service
 Service -->|JSON response| API
 API -->|HTTP response| Browser
```
## Components
| Component | Responsibility | Input | Output |
|---|---|---|---|
| Browser UI | Forms, filters, list, details, timeline | User actions | HTTP requests |
| Express API | Routing, JSON parsing, error mapping | HTTP request | JSON response |
| Task service | Validation, task rules, transactions | Validated command | Task / history |
| SQLite | Durable relational storage | SQL statements | Rows |
## Key flow: create task
```mermaid
sequenceDiagram
 participant U as User
 participant UI as Browser
 participant API as Express
 participant S as Service
 participant DB as SQLite
 U->>UI: Submit task form
 UI->>API: POST /api/tasks
 API->>S: create(input)
 S->>DB: BEGIN + INSERT task
 S->>DB: INSERT created activity
 S->>DB: COMMIT
 API-->>UI: 201 task JSON
 UI-->>U: Show success
```
## Key flow: update task
```mermaid
sequenceDiagram
 participant UI as Browser
 participant API as Express
 participant S as Service
 participant DB as SQLite
 UI->>API: PATCH task with version
 API->>S: update(id,input)
 S->>DB: Read task and compare version
 S->>DB: UPDATE task + INSERT activity in transaction
 DB-->>API: Commit or rollback
 API-->>UI: Updated task or 409
```
## Boundaries and choices
- UI owns presentation and interaction only.
- Routes own HTTP concerns; service owns validation and business logic; database module owns connection and schema initialisation.
- Node.js + Express keeps the service small; SQLite provides a relational store with no paid infrastructure.
- better-sqlite3 transactions keep task and activity writes atomic.
## Failure handling
| Failure | Behaviour | Recovery |
|---|---|---|
| Invalid input | 422 with stable error shape | Correct the form |
| Missing task | 404 | Return to task list |
| Stale version | 409 conflict | Refresh and retry |
| Activity insert failure | Transaction rollback | Retry after correcting storage issue |
| Database unavailable | Generic 500; no SQL detail leaked | Restore database and retry |
## Production gaps
Authentication, authorization, backups, rate limiting, observability, CSRF strategy for cookie auth, deployment configuration and automated browser tests would be required before production.
