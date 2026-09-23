require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const containerRoutes = require('./routes/containers');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/containers', containerRoutes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error?.code === 11000) return res.status(409).json({ error: 'containerNumber already exists' });
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;

async function start() {
  if (!mongoUri) throw new Error('MONGODB_URI must be set');
  await mongoose.connect(mongoUri);
  app.listen(port, () => console.log(`Container tracking API listening on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => { console.error(error); process.exit(1); });
}

module.exports = { app, start };
