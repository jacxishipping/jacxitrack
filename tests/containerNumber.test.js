const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidContainerNumber, normalizeContainerNumber } = require('../utils/containerNumber');

test('accepts ISO 6346 container numbers with valid check digits', () => {
  assert.equal(isValidContainerNumber('CSQU3054383'), true);
  assert.equal(isValidContainerNumber('tghu 123456 7'.replaceAll(' ', '')), true);
});

test('rejects malformed or incorrectly checksummed container numbers', () => {
  assert.equal(isValidContainerNumber('CSQU3054384'), false);
  assert.equal(isValidContainerNumber('CSQ3054383'), false);
  assert.equal(isValidContainerNumber('CSQU305438'), false);
});

test('normalizes input for consistent unique storage and lookup', () => {
  assert.equal(normalizeContainerNumber(' csqu3054383 '), 'CSQU3054383');
});
