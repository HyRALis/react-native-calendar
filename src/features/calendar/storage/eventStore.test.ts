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

function fakeStorage(seed?: string) {
  const values = new Map<string, string>();

  if (seed !== undefined) {
    values.set(eventsStorageKey('alice'), seed);
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

  await createEventStore('alice', storage).save([event]);

  expect(storage.setItem).toHaveBeenCalledWith(
    eventsStorageKey('alice'),
    serializeEvents([event]),
  );
});

test('loading reads back exactly what saving wrote', async () => {
  const storage = fakeStorage();
  const store = createEventStore('alice', storage);

  await store.save([event]);

  expect(await store.load()).toEqual([event]);
});

test('loading a device that has never saved gives an empty calendar', async () => {
  expect(await createEventStore('alice', fakeStorage()).load()).toEqual([]);
});

test('accounts have separate calendars and retain their events after signing back in', async () => {
  const storage = fakeStorage();
  await createEventStore('alice', storage).save([event]);
  expect(await createEventStore('bob', storage).load()).toEqual([]);
  const bobEvent = { ...event, title: 'Bob only' };
  await createEventStore('bob', storage).save([bobEvent]);
  expect(await createEventStore('alice', storage).load()).toEqual([event]);
  expect(await createEventStore('bob', storage).load()).toEqual([bobEvent]);
});

test('unowned legacy events are not imported into any account or deleted', async () => {
  const storage = fakeStorage();
  storage.values.set('calendar.events', serializeEvents([event]));
  expect(await createEventStore('alice', storage).load()).toEqual([]);
  expect(await createEventStore('bob', storage).load()).toEqual([]);
  expect(storage.values.get('calendar.events')).toBe(serializeEvents([event]));
});

test('account identifiers cannot collide through separators or escaping', () => {
  expect(eventsStorageKey('a/b')).not.toBe(eventsStorageKey('a%2Fb'));
  expect(() => createEventStore(' ')).toThrow(/authenticated account/);
});

test('a remounted account waits for an earlier write without blocking another account', async () => {
  const storage = fakeStorage();
  let complete!: () => void;
  storage.setItem.mockImplementationOnce(
    (key, value) =>
      new Promise<void>(resolve => {
        complete = () => {
          storage.values.set(key, value);
          resolve();
        };
      }),
  );
  const write = createEventStore('alice', storage).save([event]);
  await Promise.resolve();
  const remounted = createEventStore('alice', storage).load();
  expect(await createEventStore('bob', storage).load()).toEqual([]);
  complete();
  await write;
  expect(await remounted).toEqual([event]);
});

test('a failed write rejects but does not poison future saves for that account', async () => {
  const storage = fakeStorage();
  storage.setItem.mockRejectedValueOnce(new Error('full'));
  await expect(
    createEventStore('alice', storage).save([event]),
  ).rejects.toThrow('full');
  await createEventStore('alice', storage).save([event]);
  expect(await createEventStore('alice', storage).load()).toEqual([event]);
});
