import test from 'node:test';
import assert from 'node:assert/strict';
import { positionLabel, normalizePhoto } from '../public/assets/js/catalogue.mjs';
import { validateInquiry } from '../public/assets/js/validation.mjs';

test('catalogue positions use actual counts and safely handle empty and single lists', () => {
  assert.equal(positionLabel(0, 0), '00 / 00');
  assert.equal(positionLabel(0, 1), '01 / 01');
  assert.equal(positionLabel(15, 16), '16 / 16');
  assert.equal(positionLabel(0, 23), '01 / 23');
});

test('gallery supports WordPress attachments and static presentation images', () => {
  const wordpress = { id: 92, name: 'kitchen', url: 'http://apartaments.localhost/wp-content/uploads/kitchen.webp', srcset: 'http://apartaments.localhost/wp-content/uploads/kitchen-480.webp 480w', width: 1536, height: 2048, alt: 'Küche' };
  assert.deepEqual(normalizePhoto(wordpress, '/ignored/', {}), wordpress);
  const staticImage = normalizePhoto('kitchen', '/assets/images/', { kitchen: 'Küche' });
  assert.equal(staticImage.url, '/assets/images/kitchen-1536.webp');
  assert.match(staticImage.srcset, /kitchen-480.webp 480w/);
  assert.equal(staticImage.alt, 'Küche');
  assert.equal(normalizePhoto(null, '', {}), null);
  assert.equal(normalizePhoto({ url: '' }, '', {}), null);
});

test('inquiry validation accepts real published WordPress IDs and rejects removed apartments', () => {
  const values = { name: 'Anna Tester', email: 'anna@example.com', consent: true, apartment: '92' };
  assert.deepEqual(validateInquiry(values, '2026-10-02', [92, 104, 307]), {});
  assert.equal(validateInquiry(values, '2026-10-02', [104, 307]).apartment, 'apartment');
  assert.equal(validateInquiry(values, '2026-10-02', []).apartment, 'apartment');
  assert.equal(validateInquiry({ ...values, apartment: '' }, '2026-10-02', []).apartment, undefined);
});
