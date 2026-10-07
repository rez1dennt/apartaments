import test from 'node:test';
import assert from 'node:assert/strict';
import {formatPhone,phoneCaret,serializePhone} from '../src/phone-input.mjs';

test('phone mask always prefixes the entered digits with Germany code 49',()=>{
  assert.equal(formatPhone('+4915123456789'),'+49 1512 3456789');
  assert.equal(formatPhone('15123456789'),'+49 1512 3456789');
  assert.equal(formatPhone('0049 (1512) 345-6789'),'+49 1512 3456789');
  assert.equal(formatPhone('+442079460018').replace(/\D/g,''),'49442079460018');
  assert.equal(formatPhone('015123456789').replace(/\D/g,''),'49015123456789');
  assert.equal(formatPhone(''), '+49');
  assert.equal(formatPhone('+'), '+49');
  assert.equal(formatPhone('abc+49x1512y3456789'),'+49 1512 3456789');
});

test('phone cursor tracks digits instead of spaces inserted by the mask',()=>{
  assert.equal(phoneCaret('+49 1512 3456789',3),3);
  assert.equal(phoneCaret('+49 1512 3456789',7),8);
  assert.equal(phoneCaret('+49 1512 3456789',0),3);
});

test('an unused fixed prefix serializes as an optional empty phone',()=>{
  assert.equal(serializePhone('+49'),'');
  assert.equal(serializePhone('+49 1512 3456789'),'+49 1512 3456789');
});
