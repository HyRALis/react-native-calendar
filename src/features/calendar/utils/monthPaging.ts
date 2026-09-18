import { addMonths, differenceInMonths, startOfMonth } from './calendarDates';

/**
 * How many years either side of the anchor the calendar can reach. The pager
 * and the year picker both derive from it, and the range covers whole years, so
 * every month of every offered year is reachable and the two cannot disagree.
 */
export const calendarYearRadius = 10;

export function firstMonthInRange(
  anchor: Date,
  yearRadius: number = calendarYearRadius,
): Date {
  return new Date(anchor.getFullYear() - yearRadius, 0, 1, 12);
}

export function buildMonthRange(
  anchor: Date,
  yearRadius: number = calendarYearRadius,
): Date[] {
  const first = firstMonthInRange(anchor, yearRadius);

  return Array.from({ length: (yearRadius * 2 + 1) * 12 }, (_, index) =>
    addMonths(first, index),
  );
}

export function indexOfMonth(
  anchor: Date,
  month: Date,
  yearRadius: number = calendarYearRadius,
): number {
  return differenceInMonths(firstMonthInRange(anchor, yearRadius), month);
}

export function monthAtIndex(
  anchor: Date,
  index: number,
  yearRadius: number = calendarYearRadius,
): Date {
  return addMonths(firstMonthInRange(anchor, yearRadius), index);
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
  const index = indexOfMonth(anchor, month, yearRadius);
  const lastIndex = (yearRadius * 2 + 1) * 12 - 1;

  if (index < 0) {
    return firstMonthInRange(anchor, yearRadius);
  }

  return index > lastIndex
    ? monthAtIndex(anchor, lastIndex, yearRadius)
    : startOfMonth(month);
}
