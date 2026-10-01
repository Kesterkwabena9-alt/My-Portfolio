import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContactPayload } from '../server.js';

test('valid contact payload passes validation', () => {
  const result = validateContactPayload({
    name: 'Kester Kwabena Datsa',
    email: 'kesterkwabena9@gmail.com',
    subject: 'Project inquiry',
    message: 'Hello, I would like to work together.'
  });

  assert.equal(result.valid, true);
});

test('missing fields fail validation', () => {
  const result = validateContactPayload({
    name: 'Kester Kwabena Datsa',
    email: 'kesterkwabena9@gmail.com'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});
