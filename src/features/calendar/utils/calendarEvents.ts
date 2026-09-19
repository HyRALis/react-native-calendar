import type { CalendarEvent } from '../types';
import { isSameDay } from './calendarDates';

export function eventsForDay(
  events: readonly CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return events
    .filter(event =>
      event.end && event.end > event.start
        ? event.start < end && event.end > start
        : isSameDay(event.start, day),
    )
    .sort((left, right) => left.start.getTime() - right.start.getTime());
}

export function formatEventDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

export function formatEventSchedule(event: CalendarEvent): string {
  if (!event.end) {
    return formatEventDateTime(event.start);
  }
  return `${formatEventDateTime(event.start)} – ${
    isSameDay(event.start, event.end)
      ? formatEventTime(event.end)
      : formatEventDateTime(event.end)
  }`;
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
