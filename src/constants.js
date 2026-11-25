const STATUSES = Object.freeze(['Todo', 'In Progress', 'Done']);
const PRIORITIES = Object.freeze(['Low', 'Medium', 'High']);
module.exports = { STATUSES, PRIORITIES, DEFAULT_STATUS: 'Todo', DEFAULT_PRIORITY: 'Medium', DEFAULT_PAGE_SIZE: 10, MAX_PAGE_SIZE: 50 };
