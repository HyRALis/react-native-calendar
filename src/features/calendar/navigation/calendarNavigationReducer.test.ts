import { getWeekDays, isSameDay, isSameMonth } from '../utils/calendarDates';
import { calendarYearRadius } from '../utils/calendarPaging';
import {
  calendarNavigationReducer as reduce,
  createCalendarNavigationState,
  type CalendarNavigationState,
} from './calendarNavigationReducer';

const today = new Date(2026, 2, 17, 8, 30);

function initial(overrides = {}): CalendarNavigationState {
  return createCalendarNavigationState({ today, ...overrides });
}

function parts(date: Date) {
  return [date.getFullYear(), date.getMonth(), date.getDate()];
}

test('the initial state focuses today at midday in the month view', () => {
  const state = initial();
  expect(state.view).toBe('month');
  expect(parts(state.focusedDate)).toEqual([2026, 2, 17]);
  expect(state.focusedDate.getHours()).toBe(12);
  expect(parts(state.anchor)).toEqual([2026, 2, 1]);
});

test('an initial date and view can be supplied', () => {
  const state = initial({
    initialDate: new Date(2026, 6, 4),
    initialView: 'week',
  });
  expect(state.view).toBe('week');
  expect(parts(state.focusedDate)).toEqual([2026, 6, 4]);
});

test('switching view keeps the focused date', () => {
  const state = reduce(initial(), { type: 'setView', view: 'day' });
  expect(state.view).toBe('day');
  expect(parts(state.focusedDate)).toEqual([2026, 2, 17]);
});

test('focusing a date keeps the current view', () => {
  const week = reduce(initial(), { type: 'setView', view: 'week' });
  const state = reduce(week, { type: 'focusDate', date: new Date(2026, 4, 2) });
  expect(state.view).toBe('week');
  expect(parts(state.focusedDate)).toEqual([2026, 4, 2]);
});

test.each([
  ['openDay', 'day'],
  ['openWeek', 'week'],
  ['openMonth', 'month'],
] as const)('%s moves the date and the view together', (_name, view) => {
  const state = reduce(initial(), {
    type: 'openDate',
    date: new Date(2026, 9, 31),
    view,
  });
  expect(state.view).toBe(view);
  expect(parts(state.focusedDate)).toEqual([2026, 9, 31]);
});

test('paging to another month keeps the day of the month', () => {
  const state = reduce(initial(), {
    type: 'goToMonth',
    month: new Date(2026, 7, 1),
  });
  expect(parts(state.focusedDate)).toEqual([2026, 7, 17]);
});

test('paging into a shorter month clamps instead of skipping it', () => {
  const onThe31st = reduce(initial(), {
    type: 'focusDate',
    date: new Date(2026, 0, 31),
  });
  const february = reduce(onThe31st, { type: 'step', delta: 1 });
  expect(parts(february.focusedDate)).toEqual([2026, 1, 28]);
});

test.each([
  ['day', 1, [2026, 2, 18]],
  ['day', -1, [2026, 2, 16]],
  ['week', 1, [2026, 2, 24]],
  ['week', -1, [2026, 2, 10]],
  ['month', 1, [2026, 3, 17]],
  ['month', -1, [2026, 1, 17]],
] as const)(
  'a step in the %s view moves by its own unit',
  (view, delta, expected) => {
    const state = reduce(reduce(initial(), { type: 'setView', view }), {
      type: 'step',
      delta,
    });
    expect(parts(state.focusedDate)).toEqual(expected);
  },
);

test('going to today returns from anywhere', () => {
  const away = reduce(initial(), {
    type: 'focusDate',
    date: new Date(2029, 10, 2),
  });
  const back = reduce(away, { type: 'goToToday' });
  expect(isSameDay(back.focusedDate, today)).toBe(true);
});

test('dates outside the reachable range are clamped, not accepted', () => {
  const past = reduce(initial(), {
    type: 'focusDate',
    date: new Date(1990, 5, 9),
  });
  const future = reduce(initial(), {
    type: 'focusDate',
    date: new Date(2200, 5, 9),
  });
  expect(past.focusedDate.getFullYear()).toBe(2026 - calendarYearRadius);
  expect(future.focusedDate.getFullYear()).toBe(2026 + calendarYearRadius);
});

test('an action that changes nothing returns the same state object', () => {
  const state = initial();
  expect(reduce(state, { type: 'setView', view: 'month' })).toBe(state);
  expect(
    reduce(state, { type: 'focusDate', date: new Date(2026, 2, 17, 23) }),
  ).toBe(state);
  expect(reduce(state, { type: 'goToToday' })).toBe(state);
});

describe('seamless navigation between views', () => {
  test('a day opened from the month view shows that exact day', () => {
    const inMay = reduce(initial(), {
      type: 'goToMonth',
      month: new Date(2026, 4, 1),
    });
    const opened = reduce(inMay, {
      type: 'openDate',
      date: new Date(2026, 4, 21),
      view: 'day',
    });

    expect(opened.view).toBe('day');
    expect(parts(opened.focusedDate)).toEqual([2026, 4, 21]);
  });

  test('the week view opened from a day contains that day', () => {
    const onADay = reduce(initial(), {
      type: 'openDate',
      date: new Date(2026, 4, 21),
      view: 'day',
    });
    const asWeek = reduce(onADay, { type: 'setView', view: 'week' });

    expect(
      getWeekDays(asWeek.focusedDate).some(day =>
        isSameDay(day, new Date(2026, 4, 21)),
      ),
    ).toBe(true);
  });

  test('the month view returned to from a week shows that week’s month', () => {
    const onADay = reduce(initial(), {
      type: 'openDate',
      date: new Date(2026, 4, 21),
      view: 'week',
    });
    const asMonth = reduce(onADay, { type: 'setView', view: 'month' });

    expect(isSameMonth(asMonth.focusedDate, new Date(2026, 4, 1))).toBe(true);
  });

  test('a round trip through every view never loses the date', () => {
    const start = reduce(initial(), {
      type: 'openDate',
      date: new Date(2026, 4, 21),
      view: 'day',
    });
    const roundTrip = (['week', 'month', 'day'] as const).reduce(
      (state, view) => reduce(state, { type: 'setView', view }),
      start,
    );

    expect(parts(roundTrip.focusedDate)).toEqual([2026, 4, 21]);
  });
});

describe('settling on a page keeps the part of the date the view does not page', () => {
  test('a month page keeps the day of the month', () => {
    const state = reduce(initial(), {
      type: 'goToPage',
      pageDate: new Date(2026, 7, 1, 12),
    });
    expect(parts(state.focusedDate)).toEqual([2026, 7, 17]);
  });

  test('a week page keeps the day of the week', () => {
    const inWeek = reduce(initial(), { type: 'setView', view: 'week' });
    const state = reduce(inWeek, {
      type: 'goToPage',
      pageDate: new Date(2026, 4, 4, 12),
    });
    expect(state.focusedDate.getDay()).toBe(2);
    expect(parts(state.focusedDate)).toEqual([2026, 4, 5]);
  });

  test('a day page is the day itself', () => {
    const inDay = reduce(initial(), { type: 'setView', view: 'day' });
    const state = reduce(inDay, {
      type: 'goToPage',
      pageDate: new Date(2026, 4, 21, 12),
    });
    expect(parts(state.focusedDate)).toEqual([2026, 4, 21]);
  });

  test('paging weeks repeatedly never drifts off the weekday', () => {
    const inWeek = reduce(initial(), { type: 'setView', view: 'week' });
    let state = inWeek;

    for (let page = 0; page < 8; page++) {
      state = reduce(state, { type: 'step', delta: 1 });
    }

    expect(state.focusedDate.getDay()).toBe(inWeek.focusedDate.getDay());
    expect(parts(state.focusedDate)).toEqual([2026, 4, 12]);
  });
});
