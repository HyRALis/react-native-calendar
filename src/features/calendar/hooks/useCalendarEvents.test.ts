import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { EventStore } from '../storage/eventStore';
import type { CalendarEvent } from '../types';
import type { EventDraft } from '../utils/eventDraft';
import { useCalendarEvents } from './useCalendarEvents';

const stored: CalendarEvent = {
  id: 'stored',
  title: 'From the device',
  start: new Date(2026, 2, 18, 11, 0),
};

function draft(title: string): EventDraft {
  return {
    title,
    description: '',
    start: new Date(2026, 2, 17, 9, 0),
    end: new Date(2026, 2, 17, 10, 0),
  };
}

function fakeStore(initial: CalendarEvent[] = []): EventStore & {
  saved: CalendarEvent[][];
} {
  const saved: CalendarEvent[][] = [];

  return {
    saved,
    load: jest.fn(async () => initial),
    save: jest.fn(async events => {
      saved.push([...events]);
    }),
  };
}

async function renderEvents(store: EventStore) {
  const view = renderHook(() => useCalendarEvents(store));
  await waitFor(() => expect(store.load).toHaveBeenCalled());

  return view;
}

test('events stored on the device are shown after they load', async () => {
  const { result } = await renderEvents(fakeStore([stored]));

  await waitFor(() => expect(result.current.events).toEqual([stored]));
});

test('a device with nothing stored opens an empty calendar', async () => {
  const { result } = await renderEvents(fakeStore());

  expect(result.current.events).toEqual([]);
});

test('adding writes the whole list back to the device', async () => {
  const store = fakeStore();
  const { result } = await renderEvents(store);

  await act(async () => {
    result.current.addEvent(draft('Standup'));
  });

  await waitFor(() => expect(store.save).toHaveBeenCalled());
  const lastSave = store.saved[store.saved.length - 1];
  expect(lastSave.map(saved => saved.title)).toEqual(['Standup']);
});

test('added events sit alongside the ones that were loaded', async () => {
  const store = fakeStore([stored]);
  const { result } = await renderEvents(store);
  await waitFor(() => expect(result.current.events).toEqual([stored]));

  await act(async () => {
    result.current.addEvent(draft('Standup'));
  });

  expect(result.current.events.map(event => event.title)).toEqual([
    'From the device',
    'Standup',
  ]);
});

test('a load that fails leaves the calendar usable but stops writing', async () => {
  const store = fakeStore();
  store.load = jest.fn(async () => {
    throw new Error('device unavailable');
  });

  const { result } = await renderEvents(store);

  await act(async () => {
    result.current.addEvent(draft('Standup'));
  });

  expect(result.current.events).toHaveLength(1);
  expect(store.save).not.toHaveBeenCalled();
});

test('a save that fails does not take the calendar down with it', async () => {
  const store = fakeStore();
  store.save = jest.fn(async () => {
    throw new Error('device full');
  });
  const { result } = await renderEvents(store);

  await act(async () => {
    result.current.addEvent(draft('Standup'));
  });

  expect(result.current.events.map(event => event.title)).toEqual(['Standup']);
});

test('each added event gets an id of its own', async () => {
  const { result } = await renderEvents(fakeStore());

  await act(async () => {
    result.current.addEvent(draft('Standup'));
    result.current.addEvent(draft('Planning'));
  });

  const [first, second] = result.current.events;
  expect(first.id).not.toBe(second.id);
});

test('adding returns the stored event, trimmed', async () => {
  const { result } = await renderEvents(fakeStore());

  let added: CalendarEvent | undefined;
  await act(async () => {
    added = result.current.addEvent(draft('  Standup  '));
  });

  expect(added?.title).toBe('Standup');
  expect(result.current.events[0]).toBe(added);
});

test('the add action keeps one identity across renders', async () => {
  const { result, rerender } = await renderEvents(fakeStore());
  const first = result.current.addEvent;

  rerender(undefined);

  expect(result.current.addEvent).toBe(first);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test.each([{ initial: [] as CalendarEvent[] }, { initial: [stored] }])(
  'adding while hydration is pending preserves and persists both lists (%j)',
  async ({ initial }) => {
    const loading = deferred<CalendarEvent[]>();
    const store = fakeStore();
    store.load = jest.fn(() => loading.promise);
    const { result } = renderHook(() => useCalendarEvents(store));
    act(() => {
      result.current.addEvent(draft('During load'));
    });
    expect(store.save).not.toHaveBeenCalled();
    await act(async () => {
      loading.resolve(initial);
    });
    expect(result.current.events.map(event => event.title)).toEqual([
      ...initial.map(event => event.title),
      'During load',
    ]);
    await waitFor(() =>
      expect(store.save).toHaveBeenLastCalledWith(result.current.events),
    );
  },
);

test('writes are serialized so an older snapshot cannot finish last', async () => {
  const firstWrite = deferred<void>();
  const store = fakeStore();
  store.save = jest
    .fn()
    .mockImplementationOnce(() => firstWrite.promise)
    .mockResolvedValue(undefined);
  const { result } = await renderEvents(store);
  await act(async () => {
    result.current.addEvent(draft('First'));
    result.current.addEvent(draft('Second'));
  });
  expect(store.save).toHaveBeenCalledTimes(1);
  await act(async () => {
    firstWrite.resolve();
  });
  expect(store.save).toHaveBeenCalledTimes(2);
  expect(store.save).toHaveBeenLastCalledWith(result.current.events);
});

test('retrying a failed read merges pending additions without duplicates', async () => {
  const store = fakeStore([stored]);
  store.load = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue([stored]);
  const { result } = await renderEvents(store);
  await waitFor(() =>
    expect(result.current.error).toMatch(/could not be loaded/),
  );
  act(() => {
    result.current.addEvent(draft('Pending'));
  });
  expect(store.save).not.toHaveBeenCalled();
  await act(async () => {
    result.current.retry();
  });
  await waitFor(() => expect(result.current.error).toBeNull());
  expect(result.current.events.map(event => event.title)).toEqual([
    'From the device',
    'Pending',
  ]);
  await waitFor(() =>
    expect(store.save).toHaveBeenLastCalledWith(result.current.events),
  );
});

test('a failed write can be retried and does not block later writes', async () => {
  const store = fakeStore();
  store.save = jest
    .fn()
    .mockRejectedValueOnce(new Error('full'))
    .mockResolvedValue(undefined);
  const { result } = await renderEvents(store);
  await act(async () => {
    result.current.addEvent(draft('Pending'));
  });
  await waitFor(() =>
    expect(result.current.error).toMatch(/could not be saved/),
  );
  await act(async () => {
    result.current.retry();
  });
  await waitFor(() => expect(result.current.error).toBeNull());
  expect(store.save).toHaveBeenLastCalledWith(result.current.events);
});

test('switching repositories ignores late loads and keeps their events separate', async () => {
  const loading = deferred<CalendarEvent[]>();
  const first = fakeStore();
  first.load = jest.fn(() => loading.promise);
  const second = fakeStore();
  const { result, rerender } = renderHook(
    ({ store }: { store: EventStore }) => useCalendarEvents(store),
    { initialProps: { store: first } },
  );
  rerender({ store: second });
  await act(async () => {
    loading.resolve([stored]);
  });
  expect(result.current.events).toEqual([]);
  await act(async () => {
    result.current.addEvent(draft('Second repository'));
  });
  expect(second.save).toHaveBeenLastCalledWith([
    expect.objectContaining({ title: 'Second repository' }),
  ]);
  expect(first.save).not.toHaveBeenCalled();
});

describe('changing an event that already exists', () => {
  test('the event is replaced in place, keeping its id and position', async () => {
    const store = fakeStore([stored]);
    const { result } = await renderEvents(store);
    await waitFor(() => expect(result.current.events).toEqual([stored]));
    act(() => {
      result.current.addEvent(draft('Second'));
    });

    await act(async () => {
      result.current.updateEvent('stored', draft('Renamed'));
    });

    expect(result.current.events.map(event => event.id)).toEqual([
      'stored',
      result.current.events[1].id,
    ]);
    expect(result.current.events.map(event => event.title)).toEqual([
      'Renamed',
      'Second',
    ]);
  });

  test('the change is written back to the device', async () => {
    const store = fakeStore([stored]);
    const { result } = await renderEvents(store);
    await waitFor(() => expect(result.current.events).toEqual([stored]));

    await act(async () => {
      result.current.updateEvent('stored', draft('Renamed'));
    });

    await waitFor(() =>
      expect(store.save).toHaveBeenLastCalledWith(result.current.events),
    );
    const lastSave = store.saved[store.saved.length - 1];
    expect(lastSave.map(event => event.title)).toEqual(['Renamed']);
  });

  test('an id that is not there changes nothing', async () => {
    const store = fakeStore([stored]);
    const { result } = await renderEvents(store);
    await waitFor(() => expect(result.current.events).toEqual([stored]));

    await act(async () => {
      result.current.updateEvent('no-such-event', draft('Ghost'));
    });

    expect(result.current.events).toEqual([stored]);
  });

  test('an edit made while a read is in flight survives that read', async () => {
    const loading = deferred<CalendarEvent[]>();
    const store = fakeStore();
    store.load = jest.fn(() => loading.promise);
    const { result } = renderHook(() => useCalendarEvents(store));

    act(() => {
      result.current.addEvent(draft('During load'));
    });
    const [pending] = result.current.events;
    act(() => {
      result.current.updateEvent(pending.id, draft('Renamed during load'));
    });
    await act(async () => {
      loading.resolve([stored]);
    });

    expect(result.current.events.map(event => event.title)).toEqual([
      'From the device',
      'Renamed during load',
    ]);
  });

  test('the update action keeps one identity across renders', async () => {
    const { result, rerender } = await renderEvents(fakeStore());
    const first = result.current.updateEvent;

    rerender(undefined);

    expect(result.current.updateEvent).toBe(first);
  });
});
