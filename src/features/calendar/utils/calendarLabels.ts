import type { CalendarView } from '../types';
import { getWeekDays, isSameMonth } from './calendarDates';

/**
 * The exact period in focus, for views finer than the month name already shown
 * by the pickers. Returns null for the month view, which needs no second line.
 */
export function formatPeriodLabel(
  view: CalendarView,
  date: Date,
): string | null {
  switch (view) {
    case 'month':
      return null;
    case 'day':
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    case 'week':
      return formatWeekRange(date);
  }
}

/** A Monday-to-Sunday range, naming the month once when the week stays in it. */
export function formatWeekRange(date: Date): string {
  const days = getWeekDays(date);
  const first = days[0];
  const last = days[6];
  const dash = '–';

  if (isSameMonth(first, last)) {
    return `${first.getDate()} ${dash} ${last.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
    })}`;
  }

  const options = { day: 'numeric', month: 'short' } as const;

  return `${first.toLocaleDateString(
    undefined,
    options,
  )} ${dash} ${last.toLocaleDateString(undefined, options)}`;
}

/** What one step means in each view, for arrow labels. */
export const stepUnit: Record<CalendarView, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
};
