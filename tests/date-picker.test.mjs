import test from 'node:test';
import assert from 'node:assert/strict';
import {dateToISO,formatGermanDate,calendarDays,nextDay} from '../public/assets/js/date-picker.mjs';
test('German display dates preserve calendar validity and ISO mail payload',()=>{
  assert.equal(dateToISO('09.10.2026'),'2026-10-09');
  assert.equal(dateToISO('29.02.2028'),'2028-02-29');
  for(const value of ['29.02.2027','31.04.2026','0.12.2026','2026-10-09\0'])assert.equal(dateToISO(value),null,value);
  assert.equal(dateToISO(''),'');assert.equal(dateToISO('2026-10-09'),'2026-10-09');
  assert.equal(formatGermanDate('2026-10-09'),'09.10.2026');
  assert.equal(nextDay('2026-12-31'),'2027-01-01');
});
test('calendar starts Monday and handles month transitions without DST shifts',()=>{
  const days=calendarDays(2026,9);assert.equal(days.length,42);
  assert.equal(days[0],'2026-09-28');assert.equal(days[41],'2026-11-08');
  assert.equal(calendarDays(2028,1).filter(d=>d.startsWith('2028-02')).length,29);
});
