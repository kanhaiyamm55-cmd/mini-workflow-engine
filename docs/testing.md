# Testing
Run all tests with `npm test`.
| Test | Scenario | Type | Expected |
|---|---|---|---|
| T-01 | Create task | Unit | Defaults and created event |
| T-02 | Invalid title/priority | Unit | 422 validation error |
| T-03 | Edit task | Unit | New state and old/new activity snapshot |
| T-04 | Stale concurrent update | Unit | 409 version conflict |
| T-05 | Unknown task | Unit | 404 task-not-found |
| T-06 | Filter and pagination | Unit | Database returns matching row and total |
| T-07 | Delete task | Unit | Delete event retained and task no longer exists |
Transaction atomicity is implemented with better-sqlite3's transaction wrapper. A storage-trigger failure injection test can be added by creating a temporary trigger that aborts activity insertion, then asserting the task insert rolls back. Browser-level cross-device testing is not automated in this version.
