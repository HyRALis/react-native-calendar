import type { CalendarEvent } from '../types';
import {
  createEventDraft,
  draftToEvent,
  earliestStartFor,
  eventToDraft,
  hasEventDraftErrors,
  roundUpToStep,
  setDraftEnd,
  setDraftStart,
  validateEventDraft,
  type EventDraft,
} from './eventDraft';

function draft(overrides: Partial<EventDraft> = {}): EventDraft {
  return {
    title: 'Standup',
    description: '',
    start: new Date(2026, 2, 17, 9, 0),
    end: new Date(2026, 2, 17, 10, 0),
    ...overrides,
  };
}

test.each([
  [new Date(2026, 2, 17, 9, 47), new Date(2026, 2, 17, 10, 0)],
  [new Date(2026, 2, 17, 9, 0), new Date(2026, 2, 17, 9, 0)],
  [new Date(2026, 2, 17, 9, 0, 1), new Date(2026, 2, 17, 9, 15)],
  [new Date(2026, 2, 17, 9, 0, 0, 1), new Date(2026, 2, 17, 9, 15)],
  [new Date(2026, 2, 17, 23, 58), new Date(2026, 2, 18, 0, 0)],
])('roundUpToStep(%s) is %s', (from, expected) => {
  expect(roundUpToStep(from, 15)).toEqual(expected);
});

test.each(['start', 'end'] as const)('invalid %s dates are rejected', field => {
  expect(
    validateEventDraft(draft({ [field]: new Date(NaN) }))[field],
  ).toBeDefined();
});

test('a new draft starts on the chosen day at the next free slot', () => {
  const created = createEventDraft(new Date(2026, 3, 2, 12), {
    now: new Date(2026, 2, 17, 9, 47),
  });

  expect(created.start).toEqual(new Date(2026, 3, 2, 10, 0));
  expect(created.end).toEqual(new Date(2026, 3, 2, 11, 0));
  expect(created).toMatchObject({ title: '', description: '' });
});

test('moving the start carries the end with it, keeping the duration', () => {
  const moved = setDraftStart(draft(), new Date(2026, 2, 19, 14, 30));

  expect(moved.start).toEqual(new Date(2026, 2, 19, 14, 30));
  expect(moved.end).toEqual(new Date(2026, 2, 19, 15, 30));
});

test('moving the end alone leaves the start where it was', () => {
  const moved = setDraftEnd(draft(), new Date(2026, 2, 17, 11, 30));

  expect(moved.start).toEqual(new Date(2026, 2, 17, 9, 0));
  expect(moved.end).toEqual(new Date(2026, 2, 17, 11, 30));
});

test('a complete draft reports no errors', () => {
  const errors = validateEventDraft(draft(), new Date(2026, 2, 17, 8, 0));

  expect(errors).toEqual({});
  expect(hasEventDraftErrors(errors)).toBe(false);
});

test.each([
  ['an empty title', { title: '' }],
  ['a title of only spaces', { title: '   ' }],
])('%s is rejected', (_name, overrides) => {
  const errors = validateEventDraft(draft(overrides));

  expect(errors.title).toBeDefined();
  expect(hasEventDraftErrors(errors)).toBe(true);
});

test.each([
  ['before', new Date(2026, 2, 17, 8, 0)],
  ['equal to', new Date(2026, 2, 17, 9, 0)],
])('an end %s the start is rejected', (_name, end) => {
  expect(validateEventDraft(draft({ end })).end).toBeDefined();
});

test('the stored event trims its text and drops an empty description', () => {
  const event = draftToEvent(
    draft({ title: '  Standup  ', description: '   ' }),
    'event-1',
  );

  expect(event).toEqual({
    id: 'event-1',
    title: 'Standup',
    start: new Date(2026, 2, 17, 9, 0),
    end: new Date(2026, 2, 17, 10, 0),
  });
  expect('description' in event).toBe(false);
});

test('the stored event keeps a description that has content', () => {
  const event = draftToEvent(draft({ description: ' Daily sync ' }), 'event-2');

  expect(event.description).toBe('Daily sync');
});

test('a start before now is rejected', () => {
  const errors = validateEventDraft(
    draft({ start: new Date(2026, 2, 17, 8, 0) }),
    new Date(2026, 2, 17, 9, 47),
  );

  expect(errors.start).toBeDefined();
  expect(hasEventDraftErrors(errors)).toBe(true);
});

test.each([
  ['exactly now', new Date(2026, 2, 17, 9, 0)],
  ['later today', new Date(2026, 2, 17, 8, 0)],
  ['days earlier', new Date(2026, 2, 10, 9, 0)],
])('a start %s passes when now is not ahead of it', (_name, now) => {
  expect(validateEventDraft(draft(), now).start).toBeUndefined();
});

test('a draft for a day that has passed starts now instead', () => {
  const now = new Date(2026, 2, 17, 9, 47);
  const created = createEventDraft(new Date(2026, 1, 3, 12), { now });

  expect(created.start).toEqual(new Date(2026, 2, 17, 10, 0));
  expect(validateEventDraft(created, now).start).toBeUndefined();
});

test('a draft for a day still to come stays on that day', () => {
  const created = createEventDraft(new Date(2026, 3, 2, 12), {
    now: new Date(2026, 2, 17, 9, 47),
  });

  expect(created.start).toEqual(new Date(2026, 3, 2, 10, 0));
});

describe('editing an event that already exists', () => {
  const stored: CalendarEvent = {
    id: 'event-1',
    title: 'Standup',
    start: new Date(2026, 2, 17, 9, 0),
    end: new Date(2026, 2, 17, 9, 30),
    description: 'Daily sync',
  };

  test('a stored event becomes the draft the form edits', () => {
    expect(eventToDraft(stored)).toEqual({
      title: 'Standup',
      description: 'Daily sync',
      start: new Date(2026, 2, 17, 9, 0),
      end: new Date(2026, 2, 17, 9, 30),
    });
  });

  test('a missing description becomes an empty field, not undefined', () => {
    const { description } = eventToDraft({
      id: 'event-2',
      title: 'Focus',
      start: new Date(2026, 2, 17, 9, 0),
    });

    expect(description).toBe('');
  });

  test('a missing end becomes the default duration, so the field has a value', () => {
    const { end } = eventToDraft({
      id: 'event-3',
      title: 'Focus',
      start: new Date(2026, 2, 17, 9, 0),
    });

    expect(end).toEqual(new Date(2026, 2, 17, 10, 0));
  });

  test('a round trip through the draft keeps the id and every field', () => {
    expect(draftToEvent(eventToDraft(stored), stored.id)).toEqual(stored);
  });

  test('an event still to come is floored at now, like a new one', () => {
    const now = new Date(2026, 2, 17, 8, 0);

    expect(earliestStartFor(stored, now)).toBe(now);
  });

  test('an event that has already begun keeps its own start as the floor', () => {
    const now = new Date(2026, 2, 17, 14, 0);

    expect(earliestStartFor(stored, now)).toBe(stored.start);
  });

  test('a draft for an event that has begun stays valid where it is', () => {
    const now = new Date(2026, 2, 17, 14, 0);

    expect(
      validateEventDraft(eventToDraft(stored), earliestStartFor(stored, now)),
    ).toEqual({});
  });

  test('an event that has begun still cannot be dragged further back', () => {
    const now = new Date(2026, 2, 17, 14, 0);
    const moved = setDraftStart(
      eventToDraft(stored),
      new Date(2026, 2, 17, 8, 0),
    );

    expect(
      validateEventDraft(moved, earliestStartFor(stored, now)).start,
    ).toBeDefined();
  });
});
