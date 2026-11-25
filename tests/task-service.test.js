const test = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/database');
const { createTaskService, AppError } = require('../src/task-service');
function setup() { const db = createDatabase(':memory:'); return { db, service: createTaskService(db) }; }
test('creates a task with defaults and a created activity', () => {
  const { db, service } = setup(); const task = service.create({ title: 'First task' });
  assert.equal(task.status, 'Todo'); assert.equal(task.priority, 'Medium');
  assert.equal(service.activities(task.id).length, 1); assert.equal(service.activities(task.id)[0].action, 'created'); db.close();
});
test('rejects invalid task input', () => {
  const { db, service } = setup();
  assert.throws(() => service.create({ title: ' ', priority: 'Urgent' }), e => e instanceof AppError && e.status === 422);
  db.close();
});
test('updates fields and records old and new values', () => {
  const { db, service } = setup(); const task = service.create({ title: 'Draft' });
  const updated = service.update(task.id, { title: 'Final', version: task.version });
  assert.equal(updated.title, 'Final'); const history = service.activities(task.id);
  assert.equal(history.at(-1).old_value.title, 'Draft'); assert.equal(history.at(-1).new_value.title, 'Final'); db.close();
});
test('rejects stale concurrent updates with 409', () => {
  const { db, service } = setup(); const task = service.create({ title: 'Race' });
  service.update(task.id, { status: 'In Progress', version: task.version });
  assert.throws(() => service.update(task.id, { status: 'Done', version: task.version }), e => e.status === 409);
  db.close();
});
test('returns 404 for an unknown task', () => {
  const { db, service } = setup();
  assert.throws(() => service.getById(999), e => e.status === 404 && e.code === 'TASK_NOT_FOUND');
  db.close();
});
test('filters and paginates in the database', () => {
  const { db, service } = setup();
  service.create({ title: 'Alpha', priority: 'High' }); service.create({ title: 'Beta', priority: 'Low' });
  const result = service.list({ priority: 'High', page: '1', pageSize: '1' });
  assert.equal(result.pagination.total, 1); assert.equal(result.data[0].title, 'Alpha'); db.close();
});
test('delete records activity before removing the task', () => {
  const { db, service } = setup(); const task = service.create({ title: 'Remove me' });
  service.remove(task.id);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM task_activities WHERE task_id=? AND action='deleted'").get(task.id).n, 1);
  assert.throws(() => service.getById(task.id), e => e.status === 404); db.close();
});
