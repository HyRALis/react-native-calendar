import { atTime } from './calendarDates';
import { formatEventTime } from './calendarEvents';

export const minutesInDay = 24 * 60;

export type TimeOption = { value: number; label: string };

/** A day with no daylight-saving transition anywhere, so labels never shift. */
const labelDay = new Date(2001, 0, 1, 12);

/** Formats minutes past midnight the way event times are shown elsewhere. */
export function formatTimeOfDay(minutes: number): string {
  return formatEventTime(atTime(labelDay, minutes));
}

/**
 * Every slot of `step` minutes from `from` to the end of the day, plus
 * `include` when it falls between two slots, so a time set by some other route
 * still shows up as the chosen one rather than leaving the list with nothing
 * selected. `include` is offered even when it is earlier than `from`: a time
 * already on the draft is shown, whether or not it is still a valid choice.
 */
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
