const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../server');

test('health endpoint returns service and database state with a request ID', async () => {
  const response = await request(app).get('/health').expect(200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.database, 'disconnected');
  assert.match(response.headers['x-request-id'], /^[\da-f-]{36}$/);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('invalid container requests return a structured validation error before database access', async () => {
  const response = await request(app)
    .get('/api/containers/not-a-container')
    .expect(400);
  assert.equal(response.body.error.code, 'REQUEST_ERROR');
  assert.equal(response.body.error.message, 'Validation failed');
  assert.ok(response.body.error.details.fieldErrors.containerNumber);
  assert.ok(response.body.error.requestId);
});

test('unknown routes return a structured 404 error', async () => {
  const response = await request(app).get('/not-here').expect(404);
  assert.equal(response.body.error.message, 'Route not found');
  assert.equal(response.body.error.code, 'REQUEST_ERROR');
});

test('malformed JSON returns a client-safe validation error', async () => {
  const response = await request(app)
    .post('/api/containers')
    .set('content-type', 'application/json')
    .send('{')
    .expect(400);
  assert.equal(response.body.error.code, 'INVALID_JSON');
  assert.ok(response.body.error.requestId);
});

test('only safe client-supplied request IDs are echoed', async () => {
  const safe = await request(app).get('/health').set('x-request-id', 'tracking-request_123').expect(200);
  assert.equal(safe.headers['x-request-id'], 'tracking-request_123');

  const unsafe = await request(app).get('/health').set('x-request-id', 'spaces are not allowed').expect(200);
  assert.notEqual(unsafe.headers['x-request-id'], 'spaces are not allowed');
  assert.match(unsafe.headers['x-request-id'], /^[\da-f-]{36}$/);
});
