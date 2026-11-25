require('dotenv').config();
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const { createDatabase } = require('./src/database');
const { createApiRouter } = require('./src/routes');
function createApp(db) {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createApiRouter(db));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route was not found.', details: [] } }));
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.', details: [] } });
    if (error.status && error.code) return res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details || [] } });
    console.error(error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.', details: [] } });
  });
  return app;
}
if (require.main === module) {
  const db = createDatabase(), app = createApp(db), port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log('Mini Workflow Engine running on http://localhost:' + port));
  const stop = () => { db.close(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
module.exports = { createApp };
