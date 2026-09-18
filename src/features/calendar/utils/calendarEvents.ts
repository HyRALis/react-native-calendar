import type { CalendarEvent } from '../types';
import { isSameDay } from './calendarDates';

export function eventsForDay(
  events: readonly CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events
    .filter(event => isSameDay(event.start, day))
    .sort((left, right) => left.start.getTime() - right.start.getTime());
}

export type DayEventSummary = {
  visible: CalendarEvent[];
  overflowCount: number;
};

export function summarizeDayEvents(
  events: readonly CalendarEvent[],
  maxRows = 3,
): DayEventSummary {
  if (maxRows <= 0) {
    return { visible: [], overflowCount: events.length };
  }

  if (events.length <= maxRows) {
    return { visible: [...events], overflowCount: 0 };
  }

  return {
    visible: events.slice(0, maxRows - 1),
    overflowCount: events.length - (maxRows - 1),
  };
}

export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
