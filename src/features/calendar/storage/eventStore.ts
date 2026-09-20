import {
  appStorage,
  type KeyValueStorage,
} from '../../../shared/storage/appStorage';
import type { CalendarEvent } from '../types';

export const eventsStorageKey = 'calendar.events';

type StoredEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
};

export type EventStore = {
  load: () => Promise<CalendarEvent[]>;
  save: (events: readonly CalendarEvent[]) => Promise<void>;
};

export function serializeEvents(events: readonly CalendarEvent[]): string {
  const stored: StoredEvent[] = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start.toISOString(),
    ...(event.end ? { end: event.end.toISOString() } : {}),
    ...(event.description ? { description: event.description } : {}),
  }));

  return JSON.stringify(stored);
}

export function parseEvents(raw: string | null): CalendarEvent[] {
  if (!raw) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.reduce<CalendarEvent[]>((events, entry) => {
    const event = toEvent(entry);
    return event ? [...events, event] : events;
  }, []);
}

function toEvent(entry: unknown): CalendarEvent | null {
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }

  const { id, title, start, end, description } = entry as Partial<StoredEvent>;

  if (typeof id !== 'string' || typeof title !== 'string') {
    return null;
  }

  const startDate = toDate(start);

  if (!startDate) {
    return null;
  }

  const endDate = toDate(end);
  const event: CalendarEvent = { id, title, start: startDate };

  return {
    ...event,
    ...(endDate ? { end: endDate } : {}),
    ...(typeof description === 'string' && description ? { description } : {}),
  };
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function createEventStore(
  storage: KeyValueStorage = appStorage,
  key: string = eventsStorageKey,
): EventStore {
  return {
    load: async () => parseEvents(await storage.getItem(key)),
    save: events => storage.setItem(key, serializeEvents(events)),
  };
}

export const deviceEventStore = createEventStore();
