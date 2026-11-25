require('dotenv').config();
const { createDatabase } = require('../src/database');
const { createTaskService } = require('../src/task-service');
const db = createDatabase();
try {
  const count = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
  if (count === 0) {
    const service = createTaskService(db);
    [
      ['Prepare project brief', 'Review requirements and acceptance criteria.', 'High', 'Done'],
      ['Design database schema', 'Create task and activity tables.', 'High', 'In Progress'],
      ['Build task list UI', 'Add filters, search and pagination.', 'Medium', 'Todo'],
      ['Write API tests', 'Cover validation, conflicts and error handling.', 'High', 'Todo'],
      ['Prepare demo', 'Capture the main workflow and failure case.', 'Low', 'Todo']
    ].forEach(([title, description, priority, status]) => service.create({ title, description, priority, status }));
    console.log('Inserted five synthetic tasks.');
  } else console.log('Seed skipped: database already contains tasks.');
} finally { db.close(); }
