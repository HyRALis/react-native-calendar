import type { KeyValueStorage } from '../../../shared/storage/appStorage';
import type { CalendarEvent } from '../types';
import {
  createEventStore,
  eventsStorageKey,
  parseEvents,
  serializeEvents,
} from './eventStore';

const event: CalendarEvent = {
  id: 'event-1',
  title: 'Standup',
  start: new Date(2026, 2, 17, 9, 0),
  end: new Date(2026, 2, 17, 10, 0),
  description: 'Daily sync',
};

/** A storage that lives for one test, so nothing leaks between them. */
function fakeStorage(seed?: string) {
  const values = new Map<string, string>();

  if (seed !== undefined) {
    values.set(eventsStorageKey, seed);
  }

  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  } satisfies KeyValueStorage & { values: Map<string, string> };
}

test('an event survives a round trip through storage', () => {
  expect(parseEvents(serializeEvents([event]))).toEqual([event]);
});

test('an event without an end or a description round trips too', () => {
  const sparse: CalendarEvent = {
    id: 'event-2',
    title: 'Focus',
    start: new Date(2026, 2, 18, 14, 0),
  };

  const [restored] = parseEvents(serializeEvents([sparse]));

  expect(restored).toEqual(sparse);
  expect('end' in restored).toBe(false);
  expect('description' in restored).toBe(false);
});

test('dates come back as Dates, not as the strings they were stored as', () => {
  const [restored] = parseEvents(serializeEvents([event]));

  expect(restored.start).toBeInstanceOf(Date);
  expect(restored.start.getTime()).toBe(event.start.getTime());
});

test.each([
  ['nothing stored yet', null],
  ['an empty string', ''],
  ['a half-written value', '[{"id":"event-1","ti'],
  ['a value that is not a list', '{"id":"event-1"}'],
])('%s reads as an empty calendar', (_name, raw) => {
  expect(parseEvents(raw)).toEqual([]);
});

test('unreadable records are dropped and the rest are kept', () => {
  const raw = JSON.stringify([
    { id: 'ok', title: 'Standup', start: '2026-03-17T09:00:00.000Z' },
    { id: 'no-title', start: '2026-03-17T09:00:00.000Z' },
    { id: 'bad-date', title: 'Broken', start: 'not a date' },
    null,
    'nonsense',
  ]);

  const events = parseEvents(raw);

  expect(events).toHaveLength(1);
  expect(events[0].id).toBe('ok');
});

test('saving writes one JSON value under the calendar key', async () => {
  const storage = fakeStorage();

  await createEventStore(storage).save([event]);

  expect(storage.setItem).toHaveBeenCalledWith(
    eventsStorageKey,
    serializeEvents([event]),
  );
});

test('loading reads back exactly what saving wrote', async () => {
  const storage = fakeStorage();
  const store = createEventStore(storage);

  await store.save([event]);

  expect(await store.load()).toEqual([event]);
});

test('loading a device that has never saved gives an empty calendar', async () => {
  expect(await createEventStore(fakeStorage()).load()).toEqual([]);
});
