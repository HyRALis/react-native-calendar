import { atTime } from './calendarDates';
import { formatEventTime } from './calendarEvents';

export const minutesInDay = 24 * 60;

export type TimeOption = { value: number; label: string };

const labelDay = new Date(2001, 0, 1, 12);

export function formatTimeOfDay(minutes: number): string {
  return formatEventTime(atTime(labelDay, minutes));
}

export function buildTimeOptions(
  step = 15,
  include?: number,
  from = 0,
): TimeOption[] {
  const safeStep = Math.max(1, Math.round(step));
  const first = Math.max(0, Math.ceil(from / safeStep) * safeStep);
  const values: number[] = [];

  for (let minutes = first; minutes < minutesInDay; minutes += safeStep) {
    values.push(minutes);
  }

  if (
    include !== undefined &&
    include >= 0 &&
    include < minutesInDay &&
    !values.includes(include)
  ) {
    values.push(include);
    values.sort((left, right) => left - right);
  }

  return values.map(value => ({ value, label: formatTimeOfDay(value) }));
}
