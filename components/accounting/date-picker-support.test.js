import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addMonthsToDateInput,
  buildCalendarWeeks,
  formatDatePickerLabel,
  formatDatePickerValue,
} from './date-picker-support.js';

test('formats date picker values into stable yyyy-mm-dd strings', () => {
  assert.equal(formatDatePickerValue('2026-05-12'), '2026-05-12');
});

test('builds calendar weeks with leading and trailing overflow dates', () => {
  const weeks = buildCalendarWeeks('2026-05');

  assert.equal(weeks.length, 6);
  assert.equal(weeks[0][0]?.value, '2026-04-26');
  assert.equal(weeks[0][0]?.inCurrentMonth, false);
  assert.equal(weeks[1][5]?.value, '2026-05-08');
  assert.equal(weeks[5][6]?.value, '2026-06-06');
});

test('moves the visible month backward and forward', () => {
  assert.equal(addMonthsToDateInput('2026-05-12', -1), '2026-04-01');
  assert.equal(addMonthsToDateInput('2026-05-12', 1), '2026-06-01');
});

test('formats a readable date picker label', () => {
  assert.match(formatDatePickerLabel('2026-05-12'), /2026.*5.*12/);
});
