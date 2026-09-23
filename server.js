require('dotenv').config();
const crypto = require('crypto');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoose = require('mongoose');
const containerRoutes = require('./routes/containers');
const { AppError } = require('./utils/AppError');

function buildApp() {
  const app = express();
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const suppliedRequestId = req.get('x-request-id');
    req.requestId = /^[A-Za-z0-9._-]{1,128}$/.test(suppliedRequestId || '') ? suppliedRequestId : crypto.randomUUID();
    res.set('x-request-id', req.requestId);
    next();
  });
  app.use(helmet());
  app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : false }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.get('/health', (req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
  app.use('/api/containers', containerRoutes);
  app.use((req, res, next) => next(new AppError(404, 'Route not found')));
  app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    if (error?.code === 11000) {
      return res.status(409).json({ error: { code: 'CONTAINER_EXISTS', message: 'containerNumber already exists', requestId: req.requestId } });
    }
    const statusCode = error instanceof AppError ? error.statusCode : (error.status === 413 ? 413 : (error instanceof SyntaxError && 'body' in error ? 400 : 500));
    if (statusCode >= 500) console.error({ requestId: req.requestId, error });
    return res.status(statusCode).json({
      error: {
        code: error.code || (statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : (statusCode === 400 && error instanceof SyntaxError ? 'INVALID_JSON' : (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'))),
        message: error.message || 'Internal server error',
        ...(error.details && { details: error.details }),
        requestId: req.requestId
      }
    });
  });
  return app;
}

const app = buildApp();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;
let server;

async function start() {
  if (!mongoUri) throw new Error('MONGODB_URI must be set');
  await mongoose.connect(mongoUri);
  server = app.listen(port, () => console.log(`Container tracking API listening on port ${port}`));
  return server;
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  await new Promise((resolve) => server?.close(resolve) || resolve());
  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  start().catch((error) => { console.error(error); process.exit(1); });
  ['SIGTERM', 'SIGINT'].forEach((signal) => process.once(signal, () => shutdown(signal)));
}

module.exports = { app, buildApp, start };
