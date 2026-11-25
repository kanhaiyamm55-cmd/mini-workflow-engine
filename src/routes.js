const express = require('express');
const { AppError, createTaskService } = require('./task-service');
const { STATUSES, PRIORITIES } = require('./constants');
function createApiRouter(db) {
  const router = express.Router(), tasks = createTaskService(db);
  router.get('/meta', (_req, res) => res.json({ statuses: STATUSES, priorities: PRIORITIES }));
  router.get('/tasks', (req, res, next) => { try { res.json(tasks.list(req.query)); } catch (error) { next(error); } });
  router.post('/tasks', (req, res, next) => { try { res.status(201).json({ data: tasks.create(req.body) }); } catch (error) { next(error); } });
  router.get('/tasks/:id', (req, res, next) => { try { const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found.'); res.json({ data: tasks.getById(id) }); } catch (error) { next(error); } });
  router.patch('/tasks/:id', (req, res, next) => { try { const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found.'); res.json({ data: tasks.update(id, req.body) }); } catch (error) { next(error); } });
  router.delete('/tasks/:id', (req, res, next) => { try { const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found.'); res.json({ data: tasks.remove(id) }); } catch (error) { next(error); } });
  router.get('/tasks/:id/activities', (req, res, next) => { try { const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) throw new AppError(404, 'TASK_NOT_FOUND', 'Task was not found.'); res.json({ data: tasks.activities(id) }); } catch (error) { next(error); } });
  return router;
}
module.exports = { createApiRouter };
