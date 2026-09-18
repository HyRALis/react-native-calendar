import type { CalendarEvent } from '../types';
import {
  eventsForDay,
  formatEventTime,
  summarizeDayEvents,
} from './calendarEvents';

const day = new Date(2026, 2, 17);

function event(id: string, hour: number, dayOfMonth = 17): CalendarEvent {
  return {
    id,
    title: `Event ${id}`,
    start: new Date(2026, 2, dayOfMonth, hour),
  };
}

test('eventsForDay keeps only that local day, sorted, without mutating', () => {
  const events = [event('c', 16), event('a', 8), event('other', 9, 18)];
  const original = [...events];

  expect(eventsForDay(events, day).map(found => found.id)).toEqual(['a', 'c']);
  expect(events).toEqual(original);
});

test('eventsForDay honours the empty default', () => {
  expect(eventsForDay([], day)).toEqual([]);
});

test.each([
  [0, 0, 0],
  [1, 1, 0],
  [3, 3, 0], // Exactly three still shows every event.
  [4, 2, 2], // A fourth event costs the last row; +n counts the two it hides.
  [7, 2, 5],
])(
  '%i events render %i rows and hide %i behind the overflow',
  (count, visible, overflowCount) => {
    const events = Array.from({ length: count }, (_, index) =>
      event(String(index), index),
    );
    const summary = summarizeDayEvents(events);

    expect(summary.visible).toHaveLength(visible);
    expect(summary.overflowCount).toBe(overflowCount);
    // The body never grows past its row budget.
    expect(
      summary.visible.length + (summary.overflowCount > 0 ? 1 : 0),
    ).toBeLessThanOrEqual(3);
  },
);

test('the row budget is configurable', () => {
  const events = Array.from({ length: 5 }, (_, index) =>
    event(String(index), index),
  );
  expect(summarizeDayEvents(events, 2)).toEqual({
    visible: [events[0]],
    overflowCount: 4,
  });
  expect(summarizeDayEvents(events, 0)).toEqual({
    visible: [],
    overflowCount: 5,
  });
});

test('event times are formatted for the active locale', () => {
  const start = new Date(2026, 2, 17, 9, 30);
  expect(formatEventTime(start)).toBe(
    start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  );
});
