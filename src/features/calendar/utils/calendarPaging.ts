import type { CalendarView } from '../types';
import {
  addDays,
  addMonths,
  atMidday,
  differenceInDays,
  differenceInMonths,
  isSameMonth,
  sameDayInMonth,
  startOfMonth,
  startOfWeek,
} from './calendarDates';

/**
 * How many years either side of the anchor the calendar can reach. Every view
 * pages over the same span of whole years, so switching view never strands you
 * on a date the new view cannot scroll to.
 */
export const calendarYearRadius = 10;

/** The first day in range: 1 January of the earliest year. */
export function firstDayInRange(
  anchor: Date,
  yearRadius: number = calendarYearRadius,
): Date {
  return new Date(anchor.getFullYear() - yearRadius, 0, 1, 12);
}

/** The last day in range: 31 December of the latest year. */
export function lastDayInRange(
  anchor: Date,
  yearRadius: number = calendarYearRadius,
): Date {
  return new Date(anchor.getFullYear() + yearRadius, 11, 31, 12);
}

/** The origin every page index for `view` is measured from. */
export function firstPageInRange(
  view: CalendarView,
  anchor: Date,
  yearRadius: number = calendarYearRadius,
): Date {
  const first = firstDayInRange(anchor, yearRadius);

  // Weeks start on the Monday on or before 1 January, so the first page holds
  // that day rather than beginning mid-week.
  return view === 'week' ? startOfWeek(first) : first;
}

export function pageCount(
  view: CalendarView,
  anchor: Date,
  yearRadius: number = calendarYearRadius,
): number {
  if (view === 'month') {
    return (yearRadius * 2 + 1) * 12;
  }

  const span = differenceInDays(
    firstPageInRange(view, anchor, yearRadius),
    lastDayInRange(anchor, yearRadius),
  );

  return view === 'day' ? span + 1 : Math.floor(span / 7) + 1;
}

/** Which page of `view` holds `date`. */
export function indexOfDate(
  view: CalendarView,
  anchor: Date,
  date: Date,
  yearRadius: number = calendarYearRadius,
): number {
  const first = firstPageInRange(view, anchor, yearRadius);

  switch (view) {
    case 'month':
      return differenceInMonths(startOfMonth(first), date);
    case 'week':
      return Math.floor(differenceInDays(first, date) / 7);
    case 'day':
      return differenceInDays(first, date);
  }
}

/** Where page `index` of `view` starts: a month's 1st, a Monday, or the day. */
export function dateAtIndex(
  view: CalendarView,
  anchor: Date,
  index: number,
  yearRadius: number = calendarYearRadius,
): Date {
  const first = firstPageInRange(view, anchor, yearRadius);

  switch (view) {
    case 'month':
      return addMonths(startOfMonth(first), index);
    case 'week':
      return addDays(first, index * 7);
    case 'day':
      return addDays(first, index);
  }
}

export function buildYearOptions(
  anchor: Date,
  yearRadius: number = calendarYearRadius,
): number[] {
  const first = anchor.getFullYear() - yearRadius;

  return Array.from(
    { length: yearRadius * 2 + 1 },
    (_, index) => first + index,
  );
}

export function clampMonthToRange(
  anchor: Date,
  month: Date,
  yearRadius: number = calendarYearRadius,
): Date {
  const index = indexOfDate('month', anchor, month, yearRadius);
  const lastIndex = pageCount('month', anchor, yearRadius) - 1;

  if (index < 0) {
    return dateAtIndex('month', anchor, 0, yearRadius);
  }

  return index > lastIndex
    ? dateAtIndex('month', anchor, lastIndex, yearRadius)
    : startOfMonth(month);
}

/** Like `clampMonthToRange`, but keeps the day-of-month. */
export function clampDateToRange(
  anchor: Date,
  date: Date,
  yearRadius: number = calendarYearRadius,
): Date {
  const month = clampMonthToRange(anchor, date, yearRadius);

  return isSameMonth(month, date)
    ? atMidday(date)
    : sameDayInMonth(month, date);
}
