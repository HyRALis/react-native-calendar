import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { deviceEventStore, type EventStore } from '../storage/eventStore';
import type { CalendarEvent } from '../types';
import { draftToEvent, type EventDraft } from '../utils/eventDraft';

export type CalendarEventStore = {
  events: readonly CalendarEvent[];
  addEvent: (draft: EventDraft) => CalendarEvent;
  updateEvent: (id: string, draft: EventDraft) => CalendarEvent;
  error: string | null;
  retry: () => void;
};

/** Merge pending additions after hydration and serialize whole-list writes. */
export function useCalendarEvents(
  store: EventStore = deviceEventStore,
): CalendarEventStore {
  const [, refresh] = useReducer((version: number) => version + 1, 0);
  const [attempt, setAttempt] = useState(0);
  // Each repository has its own state and queue; a late response from an old
  // repository must never replace or persist the current repository's events.
  const session = useMemo(
    () => ({
      store,
      events: [] as readonly CalendarEvent[],
      loaded: false,
      active: false,
      dirty: false,
      error: null as string | null,
      writes: Promise.resolve(),
    }),
    [store],
  );

  const persist = useCallback(() => {
    const snapshot = session.events;
    session.writes = session.writes
      .then(() => store.save(snapshot))
      .then(() => {
        const previousError = session.error;
        if (session.events === snapshot) {
          session.dirty = false;
          session.error = null;
        }
        if (session.active && previousError !== session.error) {
          refresh();
        }
      })
      .catch(() => {
        session.error =
          'Events could not be saved. New events are only available in this session.';
        if (session.active) {
          refresh();
        }
      });
  }, [session, store]);

  useEffect(() => {
    let active = true;
    session.active = true;
    session.loaded = false;

    // Retry waits for earlier writes before re-reading and merging by ID.
    session.writes
      .then(() => store.load())
      .then(stored => {
        if (!active) {
          return;
        }
        const merged = new Map(stored.map(event => [event.id, event]));
        const shouldRefresh = stored.length > 0 || session.error !== null;
        session.events.forEach(event => merged.set(event.id, event));
        session.events = [...merged.values()];
        session.loaded = true;
        session.error = null;
        if (shouldRefresh) {
          refresh();
        }
        if (session.dirty) {
          persist();
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        session.error =
          'Saved events could not be loaded. New events are only available in this session.';
        refresh();
      });

    return () => {
      active = false;
      session.active = false;
    };
  }, [attempt, persist, session, store]);

  const addEvent = useCallback(
    (draft: EventDraft) => {
      const event = draftToEvent(draft, `event-${Date.now()}-${nextId()}`);
      session.events = [...session.events, event];
      session.dirty = true;
      refresh();
      if (session.loaded) {
        persist();
      }
      return event;
    },
    [persist, session],
  );

  /**
   * Replaces an event in place, keeping its id and its position in the list.
   * Because hydration merges by id and lets the session win, an edit made
   * while a read is still in flight survives that read rather than being
   * overwritten by the stored copy.
   */
  const updateEvent = useCallback(
    (id: string, draft: EventDraft) => {
      const event = draftToEvent(draft, id);
      session.events = session.events.map(current =>
        current.id === id ? event : current,
      );
      session.dirty = true;
      refresh();
      if (session.loaded) {
        persist();
      }
      return event;
    },
    [persist, session],
  );

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return {
    events: session.events,
    addEvent,
    updateEvent,
    error: session.error,
    retry,
  };
}

let counter = 0;
function nextId(): number {
  counter += 1;
  return counter;
}
