import type { CalendarView } from '../types';
import { addDays, isSameDay, isSameMonth } from './calendarDates';
import {
  buildYearOptions,
  calendarYearRadius,
  clampDateToRange,
  clampMonthToRange,
  dateAtIndex,
  firstDayInRange,
  indexOfDate,
  lastDayInRange,
  pageCount,
} from './calendarPaging';

const anchor = new Date(2026, 2, 17, 9);
const views: CalendarView[] = ['day', 'week', 'month'];

test('the range spans whole years, the same years in every view', () => {
  expect(firstDayInRange(anchor).getFullYear()).toBe(2016);
  expect([
    firstDayInRange(anchor).getMonth(),
    firstDayInRange(anchor).getDate(),
  ]).toEqual([0, 1]);
  expect(lastDayInRange(anchor).getFullYear()).toBe(2036);
  expect([
    lastDayInRange(anchor).getMonth(),
    lastDayInRange(anchor).getDate(),
  ]).toEqual([11, 31]);
});

test('the month view pages over every month of every year in range', () => {
  expect(pageCount('month', anchor)).toBe((calendarYearRadius * 2 + 1) * 12);
});

test.each(views)('%s: index and page-start conversions round-trip', view => {
  const count = pageCount(view, anchor);

  [0, 1, Math.floor(count / 2), count - 2, count - 1].forEach(index => {
    expect(indexOfDate(view, anchor, dateAtIndex(view, anchor, index))).toBe(
      index,
    );
  });
});

test.each(views)('%s: pages are contiguous and cover the whole range', view => {
  const count = pageCount(view, anchor);

  expect(indexOfDate(view, anchor, firstDayInRange(anchor))).toBe(0);
  expect(indexOfDate(view, anchor, lastDayInRange(anchor))).toBe(count - 1);
});

test('day pages advance one day at a time', () => {
  const first = dateAtIndex('day', anchor, 0);
  expect(isSameDay(dateAtIndex('day', anchor, 1), addDays(first, 1))).toBe(
    true,
  );
  expect(indexOfDate('day', anchor, new Date(2026, 2, 17))).toBe(
    indexOfDate('day', anchor, new Date(2026, 2, 16)) + 1,
  );
});

test('week pages start on Monday and advance seven days', () => {
  const first = dateAtIndex('week', anchor, 0);
  expect(first.getDay()).toBe(1);
  expect(isSameDay(dateAtIndex('week', anchor, 1), addDays(first, 7))).toBe(
    true,
  );
  const monday = new Date(2026, 2, 16, 12);
  Array.from({ length: 7 }, (_, offset) => addDays(monday, offset)).forEach(
    day => {
      expect(indexOfDate('week', anchor, day)).toBe(
        indexOfDate('week', anchor, monday),
      );
    },
  );
});

test('the first week page reaches back far enough to hold 1 January', () => {
  const firstWeek = dateAtIndex('week', anchor, 0);
  expect(firstWeek.getTime()).toBeLessThanOrEqual(
    firstDayInRange(anchor).getTime(),
  );
  expect(indexOfDate('week', anchor, firstDayInRange(anchor))).toBe(0);
});

test('every year the picker offers has all twelve of its months in range', () => {
  buildYearOptions(anchor).forEach(year => {
    for (let month = 0; month < 12; month++) {
      const index = indexOfDate('month', anchor, new Date(year, month, 1, 12));
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(pageCount('month', anchor));
      expect(
        isSameMonth(
          dateAtIndex('month', anchor, index),
          new Date(year, month, 1),
        ),
      ).toBe(true);
    }
  });
});

test.each([
  [new Date(2000, 5, 4), 2016, 0],
  [new Date(2099, 5, 4), 2036, 11],
  [new Date(2026, 6, 29), 2026, 6],
])('clampMonthToRange(%s) resolves to %i-%i', (month, year, monthIndex) => {
  const clamped = clampMonthToRange(anchor, month);
  expect([
    clamped.getFullYear(),
    clamped.getMonth(),
    clamped.getDate(),
  ]).toEqual([year, monthIndex, 1]);
});

test('clampDateToRange keeps the day-of-month inside the range', () => {
  const inside = clampDateToRange(anchor, new Date(2026, 6, 29, 4));
  expect([inside.getMonth(), inside.getDate(), inside.getHours()]).toEqual([
    6, 29, 12,
  ]);
  expect(clampDateToRange(anchor, new Date(2200, 1, 3)).getFullYear()).toBe(
    2036,
  );
});
