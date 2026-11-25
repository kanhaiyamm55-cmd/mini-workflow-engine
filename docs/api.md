# API Reference
Base path: `/api`. All request and response bodies are JSON.
| Method | Path | Purpose |
|---|---|---|
| GET | /meta | Shared status and priority values |
| GET | /tasks | List, filter, search, sort and paginate |
| POST | /tasks | Create task |
| GET | /tasks/:id | Task detail |
| PATCH | /tasks/:id | Partial update; version required |
| DELETE | /tasks/:id | Delete task and record event |
| GET | /tasks/:id/activities | Chronological task history |
## List query
Optional `status`, `priority`, `search`, `page` (default 1), `pageSize` (default 10, maximum 50), `sortBy` (updated_at, created_at, title) and `sortOrder` (asc/desc).
## Create example
```http
POST /api/tasks
Content-Type: application/json
{"title":"Prepare demo","description":"Record the workflow","priority":"High"}
```
Returns 201 with `{ "data": task }`. Status defaults to Todo and priority defaults to Medium.
## Update example
```http
PATCH /api/tasks/1
Content-Type: application/json
{"status":"Done","version":1}
```
Returns 200 with `{ "data": task }`. Version is required to reject stale updates with 409.
## Errors
```json
{"error":{"code":"VALIDATION_FAILED","message":"Please correct the submitted fields.","details":[]}}
```
| Status | Meaning |
|---|---|
| 400 | Malformed JSON or invalid request body shape |
| 404 | Task or route not found |
| 409 | Optimistic concurrency conflict |
| 422 | Field or filter validation failure |
| 500 | Unexpected server error; internal database details are not exposed |
No authentication is implemented because it is out of scope for this assignment.
