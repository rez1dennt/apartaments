import test from 'node:test';
import assert from 'node:assert/strict';
let validate;
try { ({ validateInquiry: validate } = await import('../public/assets/js/validation.mjs')); } catch { validate = () => ({ unavailable: true }); }

const valid = { name: 'Anna', email: 'anna@example.com', consent: true, arrival: '2026-11-02', departure: '2026-11-05', apartment: '3', message: 'Eine Anfrage.' };

test('accepts a valid inquiry without making a reservation', () => {
  assert.deepEqual(validate(valid, '2026-10-01'), {});
});
test('requires a separate affirmative consent', () => {
  assert.equal(validate({ ...valid, consent: false }, '2026-10-01').consent, 'consent');
});
test('rejects a departure before or equal to arrival', () => {
  assert.equal(validate({ ...valid, departure: valid.arrival }, '2026-10-01').departure, 'dateOrder');
});
test('rejects past and impossible arrival dates', () => {
  for (const arrival of ['2026-09-30', '2026-02-30', 'invalid']) {
    assert.equal(validate({ ...valid, arrival }, '2026-10-01').arrival, 'date');
  }
});
test('allows dates to be omitted but requires both if one is given', () => {
  assert.deepEqual(validate({ ...valid, arrival: '', departure: '' }, '2026-10-01'), {});
  assert.equal(validate({ ...valid, departure: '' }, '2026-10-01').departure, 'datePair');
});
test('rejects malformed email, excessive message and invalid apartment', () => {
  const errors = validate({ ...valid, email: 'a\r\nBcc:other@example.com', message: 'x'.repeat(2001), apartment: '16' }, '2026-10-01');
  assert.equal(errors.email, 'email');
  assert.equal(errors.message, 'message');
  assert.equal(errors.apartment, 'apartment');
});
