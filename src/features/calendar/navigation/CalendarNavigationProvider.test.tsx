import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { isSameDay } from '../utils/calendarDates';
import {
  CalendarNavigationProvider,
  useCalendarActions,
  useCalendarNavigation,
  type CalendarNavigationProviderProps,
} from './CalendarNavigationProvider';

const today = new Date(2026, 2, 17, 8, 30);

function wrapper(props: Partial<CalendarNavigationProviderProps> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CalendarNavigationProvider today={today} {...props}>
        {children}
      </CalendarNavigationProvider>
    );
  };
}

function renderCalendar(props?: Partial<CalendarNavigationProviderProps>) {
  return renderHook(
    () => ({
      state: useCalendarNavigation(),
      actions: useCalendarActions(),
    }),
    { wrapper: wrapper(props) },
  );
}

test.each([
  ['useCalendarNavigation', useCalendarNavigation],
  ['useCalendarActions', useCalendarActions],
])('%s fails loudly outside the provider', (name, hook) => {
  expect(() => renderHook(() => hook())).toThrow(
    `${name} must be used inside a CalendarNavigationProvider.`,
  );
});

test('the visible month and week are derived from the focused date', () => {
  const { result } = renderCalendar();

  act(() => result.current.actions.openDay(new Date(2026, 4, 21)));

  expect(result.current.state.visibleMonth.getMonth()).toBe(4);
  expect(result.current.state.visibleMonth.getDate()).toBe(1);
  expect(result.current.state.visibleWeek).toHaveLength(7);
  expect(result.current.state.visibleWeek[0].getDay()).toBe(1);
  expect(
    result.current.state.visibleWeek.some(day =>
      isSameDay(day, new Date(2026, 4, 21)),
    ),
  ).toBe(true);
});

test('actions keep one identity across state changes', () => {
  const { result } = renderCalendar();
  const first = result.current.actions;

  act(() => result.current.actions.goToNext());
  act(() => result.current.actions.setView('day'));

  // Stable actions mean navigation-only consumers never re-render on a date
  // change, and useCallback dependencies on them stay honest.
  expect(result.current.actions).toBe(first);
});

test('every action moves the shared state', () => {
  const { result } = renderCalendar();

  act(() => result.current.actions.openWeek(new Date(2026, 6, 4)));
  expect(result.current.state.view).toBe('week');
  expect(result.current.state.focusedDate.getMonth()).toBe(6);

  act(() => result.current.actions.goToPrevious());
  expect(result.current.state.focusedDate.getDate()).toBe(27);

  act(() => result.current.actions.goToMonth(new Date(2026, 10, 1)));
  expect(result.current.state.focusedDate.getMonth()).toBe(10);

  act(() => result.current.actions.goToToday());
  expect(isSameDay(result.current.state.focusedDate, today)).toBe(true);

  act(() => result.current.actions.focusDate(new Date(2026, 2, 20)));
  expect(result.current.state.view).toBe('week');
  expect(result.current.state.focusedDate.getDate()).toBe(20);
});

test('the provider accepts a starting date and view', () => {
  const { result } = renderCalendar({
    initialDate: new Date(2027, 1, 9),
    initialView: 'day',
  });

  expect(result.current.state.view).toBe('day');
  expect(result.current.state.focusedDate.getFullYear()).toBe(2027);
  // today stays what it is, so the grid can still mark it.
  expect(isSameDay(result.current.state.today, today)).toBe(true);
});
