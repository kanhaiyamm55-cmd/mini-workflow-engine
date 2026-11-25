const C = require('./constants');
class AppError extends Error {
  constructor(status, code, message, details = []) { super(message); this.status = status; this.code = code; this.details = details; }
}
const json = value => JSON.stringify(value);
const snapshot = task => ({ title: task.title, description: task.description, priority: task.priority, status: task.status });
function validate(input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AppError(400, 'VALIDATION_FAILED', 'Request body must be an object.');
  const allowed = ['title', 'description', 'priority', 'status', 'version'];
  const unknown = Object.keys(input).filter(key => !allowed.includes(key));
  if (unknown.length) throw new AppError(422, 'VALIDATION_FAILED', 'Unknown field(s) in request.', unknown);
  if (partial && (!Number.isInteger(input.version) || input.version < 1)) throw new AppError(422, 'VALIDATION_FAILED', 'A positive task version is required.', ['version']);
  const errors = [];
  if (!partial || Object.hasOwn(input, 'title')) {
    if (typeof input.title !== 'string' || !input.title.trim()) errors.push('title is required');
    else if (input.title.trim().length > 120) errors.push('title must be at most 120 characters');
  }
  if (Object.hasOwn(input, 'description')) {
    if (typeof input.description !== 'string') errors.push('description must be text');
    else if (input.description.length > 2000) errors.push('description must be at most 2000 characters');
  }
  if (Object.hasOwn(input, 'priority') && !C.PRIORITIES.includes(input.priority)) errors.push('priority must be Low, Medium or High');
  if (Object.hasOwn(input, 'status') && !C.STATUSES.includes(input.status)) errors.push('status must be Todo, In Progress or Done');
  if (errors.length) throw new AppError(422, 'VALIDATION_FAILED', 'Please correct the submitted fields.', errors);
}
function createTaskService(db) {
  const log = db.prepare('INSERT INTO task_activities(task_id,task_title,action,old_value,new_value,actor_id) VALUES(@task_id,@task_title,@action,@old_value,@new_value,@actor_id)');
  function getById(id) {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found.');
    return task;
  }
  function create(input) {
    validate(input);
    const data = { title: input.title.trim(), description: (input.description || '').trim(), priority: input.priority || C.DEFAULT_PRIORITY, status: input.status || C.DEFAULT_STATUS };
    return db.transaction(() => {
      const result = db.prepare('INSERT INTO tasks(title,description,priority,status) VALUES(?,?,?,?)').run(data.title, data.description, data.priority, data.status);
      const task = getById(Number(result.lastInsertRowid));
      log.run({ task_id: task.id, task_title: task.title, action: 'created', old_value: null, new_value: json(snapshot(task)), actor_id: null });
      return task;
    })();
  }
  function update(id, input) {
    validate(input, true);
    return db.transaction(() => {
      const old = getById(id);
      if (old.version !== input.version) throw new AppError(409, 'VERSION_CONFLICT', 'This task changed elsewhere. Refresh and try again.');
      const next = {
        title: Object.hasOwn(input, 'title') ? input.title.trim() : old.title,
        description: Object.hasOwn(input, 'description') ? input.description.trim() : old.description,
        priority: Object.hasOwn(input, 'priority') ? input.priority : old.priority,
        status: Object.hasOwn(input, 'status') ? input.status : old.status
      };
      const changed = Object.keys(next).filter(key => next[key] !== old[key]);
      if (!changed.length) return old;
      db.prepare("UPDATE tasks SET title=?,description=?,priority=?,status=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND version=?")
        .run(next.title, next.description, next.priority, next.status, id, input.version);
      const task = getById(id), before = {}, after = {};
      changed.forEach(key => { before[key] = old[key]; after[key] = next[key]; });
      log.run({ task_id: id, task_title: task.title, action: changed.includes('status') ? 'status_changed' : 'edited', old_value: json(before), new_value: json(after), actor_id: null });
      return task;
    })();
  }
  function remove(id) {
    return db.transaction(() => {
      const task = getById(id);
      log.run({ task_id: id, task_title: task.title, action: 'deleted', old_value: json(snapshot(task)), new_value: null, actor_id: null });
      db.prepare('DELETE FROM tasks WHERE id=?').run(id);
      return { id, deleted: true };
    })();
  }
  function list(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.min(C.MAX_PAGE_SIZE, Math.max(1, parseInt(query.pageSize, 10) || C.DEFAULT_PAGE_SIZE));
    const where = [], args = [];
    if (query.status) { if (!C.STATUSES.includes(query.status)) throw new AppError(422, 'VALIDATION_FAILED', 'Invalid status filter.'); where.push('status=?'); args.push(query.status); }
    if (query.priority) { if (!C.PRIORITIES.includes(query.priority)) throw new AppError(422, 'VALIDATION_FAILED', 'Invalid priority filter.'); where.push('priority=?'); args.push(query.priority); }
    if (query.search) {
      const term = String(query.search).trim().slice(0, 100).replace(/[\\%_]/g, '\\$&');
      where.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
      args.push('%' + term + '%', '%' + term + '%');
    }
    const sort = ({ created_at: 'created_at', updated_at: 'updated_at', title: 'title' })[query.sortBy] || 'updated_at';
    const order = String(query.sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = db.prepare('SELECT COUNT(*) AS count FROM tasks ' + clause).get(...args).count;
    const data = db.prepare('SELECT * FROM tasks ' + clause + ' ORDER BY ' + sort + ' ' + order + ', id DESC LIMIT ? OFFSET ?').all(...args, pageSize, (page - 1) * pageSize);
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }
  function activities(id) {
    getById(id);
    return db.prepare('SELECT * FROM task_activities WHERE task_id=? ORDER BY created_at ASC,id ASC').all(id)
      .map(item => ({ ...item, old_value: item.old_value ? JSON.parse(item.old_value) : null, new_value: item.new_value ? JSON.parse(item.new_value) : null }));
  }
  return { create, getById, update, remove, list, activities };
}
module.exports = { AppError, createTaskService };
