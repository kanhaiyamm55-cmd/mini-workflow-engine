const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
function createDatabase(file = process.env.DATABASE_FILE || './data/workflow.sqlite') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
  return db;
}
module.exports = { createDatabase };
