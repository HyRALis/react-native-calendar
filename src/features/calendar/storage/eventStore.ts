import {
  appStorage,
  type KeyValueStorage,
} from '../../../shared/storage/appStorage';
import type { CalendarEvent } from '../types';

export function eventsStorageKey(accountId: string): string {
  if (!accountId.trim()) {
    throw new Error('An authenticated account is required for event storage.');
  }
  return `calendar.events.v2.${encodeURIComponent(accountId)}`;
}

const pendingWrites = new WeakMap<
  KeyValueStorage,
  Map<string, Promise<void>>
>();

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
  accountId: string,
  storage: KeyValueStorage = appStorage,
): EventStore {
  const key = eventsStorageKey(accountId);
  let queues = pendingWrites.get(storage);
  if (!queues) {
    queues = new Map();
    pendingWrites.set(storage, queues);
  }
  const accountQueues = queues;
  return {
    load: async () => {
      await accountQueues.get(key);
      return parseEvents(await storage.getItem(key));
    },
    save: events => {
      const serialized = serializeEvents(events);
      const write = (accountQueues.get(key) ?? Promise.resolve()).then(() =>
        storage.setItem(key, serialized),
      );
      const settled = write.catch(() => {});
      accountQueues.set(key, settled);
      void settled.then(() => {
        if (accountQueues.get(key) === settled) {
          accountQueues.delete(key);
        }
      });
      return write;
    },
  };
}
