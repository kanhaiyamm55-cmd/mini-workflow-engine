PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS tasks (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 2000),
 priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High')),
 status TEXT NOT NULL DEFAULT 'Todo' CHECK(status IN ('Todo','In Progress','Done')),
 version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS task_activities (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 task_id INTEGER,
 task_title TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('created','edited','status_changed','deleted')),
 old_value TEXT,
 new_value TEXT,
 actor_id TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority_updated ON tasks(status,priority,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_task_created ON task_activities(task_id,created_at ASC,id ASC);
