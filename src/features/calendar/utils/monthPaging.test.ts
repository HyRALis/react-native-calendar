import { isSameMonth } from './calendarDates';
import {
  buildMonthRange,
  buildYearOptions,
  calendarYearRadius,
  clampMonthToRange,
  indexOfMonth,
  monthAtIndex,
} from './monthPaging';

const anchor = new Date(2026, 2, 17, 9);

test('the range covers whole years so every offered month is reachable', () => {
  const months = buildMonthRange(anchor);
  expect(months).toHaveLength((calendarYearRadius * 2 + 1) * 12);
  expect(months.every(month => month.getDate() === 1)).toBe(true);
  expect(isSameMonth(months[0], new Date(2016, 0, 1))).toBe(true);
  expect(isSameMonth(months[months.length - 1], new Date(2036, 11, 1))).toBe(
    true,
  );
});

test('every year the picker offers has all twelve of its months in the range', () => {
  const months = buildMonthRange(anchor);

  buildYearOptions(anchor).forEach(year => {
    for (let month = 0; month < 12; month++) {
      const index = indexOfMonth(anchor, new Date(year, month, 1, 12));
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(months.length);
      expect(isSameMonth(months[index], new Date(year, month, 1))).toBe(true);
    }
  });
});

test('a month maps to its index regardless of the day of the month', () => {
  const months = buildMonthRange(anchor);
  const index = indexOfMonth(anchor, new Date(2026, 6, 29));
  expect(isSameMonth(months[index], new Date(2026, 6, 1))).toBe(true);
});

test('index and month conversions round-trip', () => {
  buildMonthRange(anchor).forEach((month, index) => {
    expect(indexOfMonth(anchor, month)).toBe(index);
    expect(isSameMonth(monthAtIndex(anchor, index), month)).toBe(true);
  });
});

test.each([
  [new Date(2000, 5, 4), 2016, 0], // Before the range clamps to its first month.
  [new Date(2099, 5, 4), 2036, 11], // After it clamps to the last.
  [new Date(2026, 6, 29), 2026, 6], // Inside, only the day is normalised.
])('clampMonthToRange(%s) resolves to %i-%i', (month, year, monthIndex) => {
  const clamped = clampMonthToRange(anchor, month);
  expect([
    clamped.getFullYear(),
    clamped.getMonth(),
    clamped.getDate(),
  ]).toEqual([year, monthIndex, 1]);
});
