# Mini Workflow Engine
**Anshumat Foundation — Full Stack Development Assignment 03**

A responsive task workflow application to create, edit, filter, search, sort, paginate and delete tasks. It includes a chronological activity history and protects against stale concurrent updates.

## Features
- Task CRUD with title, description, priority and status.
- Database-side status/priority filters, text search, sorting and pagination.
- Activity history for creation, edits, status changes and deletion.
- Task mutation and activity event are written in one SQLite transaction.
- Shared status/priority definitions, validation and consistent errors.
- Optimistic concurrency using a task version number (409 on stale writes).
- Responsive interface, loading/empty/error/success states and light/dark theme.

## Quick start
Prerequisites: Node.js 20+ and npm.
```bash
git clone https://github.com/kanhaiyamm55-cmd/mini-workflow-engine.git
cd mini-workflow-engine
npm install
cp .env.example .env
npm run seed
npm start
```
Open http://localhost:3000. Run tests with `npm test`.
On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.
The SQLite database is created automatically at `./data/workflow.sqlite`.

## Architecture and deliverables
- [High-level design](docs/hld.md)
- [Database design and ER diagram](docs/database.md)
- [API reference](docs/api.md)
- [UI design system](docs/design-system.md)
- [Test plan](docs/testing.md)
- Schema: [db/schema.sql](db/schema.sql)

## API
All endpoints use the `/api` prefix. See [docs/api.md](docs/api.md). Main routes: GET/POST /tasks, GET/PATCH/DELETE /tasks/:id and GET /tasks/:id/activities.

## Engineering decisions and assumptions
- SQLite is used because the brief explicitly accepts it and this project needs no paid infrastructure.
- Status defaults to Todo; priority defaults to Medium.
- Search matches title and description; filters and pagination run in SQL.
- Activity history is chronological, oldest first.
- Deletion is a hard delete of the task row, but its activity record remains with a null task_id and a saved task_title.
- Concurrent updates use optimistic locking. Clients send the version they read; stale updates receive HTTP 409.
- Task and activity writes use a single database transaction. If either write fails, both roll back.
- Page size defaults to 10 and is capped at 50.

## Trade-offs
| Decision | Gain | Cost |
|---|---|---|
| SQLite | Simple local setup and relational constraints | Single-node storage; not intended for high write concurrency |
| Vanilla JS UI | No build tooling or frontend dependency | Fewer component abstractions |
| Offset pagination | Simple page navigation | Deep pages become slower at large scale |
| Optimistic version field | Prevents silent overwrites | Client must refresh after a conflict |

## Limitations
- No authentication or multi-user roles (out of scope).
- No automated browser end-to-end suite.
- No hosted production deployment configured.
- No actor identity because authentication is not present.

## Future work
- Add an automated browser test suite.
- Add authentication and actor identity only if the product scope changes.
- Add a PostgreSQL adapter for multi-instance deployment.

## AI usage disclosure
OpenAI ChatGPT assisted with scaffolding, implementation drafts and documentation. The candidate must review the generated code, run the app and tests, inspect database behaviour, and be able to explain each design choice before submission. AI assistance does not replace candidate verification.
