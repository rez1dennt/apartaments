import test from 'node:test';
import assert from 'node:assert/strict';
import {formatPhone,phoneCaret} from '../src/phone-input.mjs';

test('phone mask supports German national and international pasted numbers',()=>{
  assert.equal(formatPhone('+4915123456789'),'+49 1512 3456789');
  assert.equal(formatPhone('015123456789'),'01512 3456789');
  assert.equal(formatPhone('0049 (1512) 345-6789'),'+49 1512 3456789');
  assert.equal(formatPhone('+442079460018'),'+44 20 7946 0018');
  assert.equal(formatPhone(''), '');
  assert.equal(formatPhone('+'), '+');
  assert.equal(formatPhone('abc+49x1512y3456789'),'+49 1512 3456789');
});

test('phone cursor tracks digits instead of spaces inserted by the mask',()=>{
  assert.equal(phoneCaret('+49 1512 3456789',3),3);
  assert.equal(phoneCaret('+49 1512 3456789',7),8);
  assert.equal(phoneCaret('+49 1512 3456789',0),0);
});
