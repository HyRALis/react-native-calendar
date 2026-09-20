import type { CalendarView } from '../types';
import { getWeekDays, isSameMonth } from './calendarDates';

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

export const stepUnit: Record<CalendarView, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
};
