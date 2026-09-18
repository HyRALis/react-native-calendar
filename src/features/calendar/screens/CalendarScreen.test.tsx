import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CalendarScreen } from './CalendarScreen';
import { CalendarNavigationProvider, useCalendarActions } from '../navigation';
import {
  buildMonthRange,
  calendarYearRadius,
  indexOfMonth,
} from '../utils/monthPaging';

const today = new Date(2026, 2, 17, 12);
const pageWidth = 300;

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1, 12).toLocaleDateString(undefined, {
    month: 'long',
  });
}

function renderScreen() {
  render(
    <CalendarNavigationProvider today={today}>
      <CalendarScreen />
    </CalendarNavigationProvider>,
  );
  fireEvent(screen.getByTestId('month-pager'), 'layout', {
    nativeEvent: { layout: { width: pageWidth, height: 600, x: 0, y: 0 } },
  });
}

/** Derive the page geometry from the range itself rather than a magic number. */
const pageCount = buildMonthRange(today).length;

function swipeByMonths(delta: number) {
  const centre = indexOfMonth(today, today);
  fireEvent(screen.getByTestId('month-pager'), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: (centre + delta) * pageWidth, y: 0 },
      layoutMeasurement: { width: pageWidth, height: 600 },
      contentSize: { width: pageCount * pageWidth, height: 600 },
    },
  });
}

test('the calendar fills the screen with no scrolling heading block', () => {
  renderScreen();
  expect(screen.queryByText('Your calendar')).toBeNull();
  expect(screen.getByTestId('calendar-view-month')).toHaveStyle({ flex: 1 });
});

test('swiping forward and back moves the visible month', () => {
  renderScreen();
  expect(screen.getByText(monthLabel(2026, 2))).toBeOnTheScreen();

  swipeByMonths(1);
  expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();

  swipeByMonths(-1);
  expect(screen.getByText(monthLabel(2026, 1))).toBeOnTheScreen();
});

test('the arrows and the pickers drive the same visible month', () => {
  renderScreen();

  fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
  fireEvent.press(screen.getByRole('radio', { name: '2030' }));
  expect(screen.getByText('2030')).toBeOnTheScreen();
  expect(screen.getByText(monthLabel(2030, 3))).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: 'Today' }));
  expect(screen.getByText(monthLabel(2026, 2))).toBeOnTheScreen();
  expect(screen.getByText('2026')).toBeOnTheScreen();
});

test('tapping a day outside the month moves to the month it belongs to', () => {
  renderScreen();
  // March 2026 trails into April, so April 1 is on the last row.
  fireEvent.press(
    screen.getByLabelText(
      new RegExp(
        `^${new Date(2026, 3, 1, 12).toLocaleDateString(undefined, {
          dateStyle: 'full',
        })}, outside the displayed month`,
      ),
    ),
  );
  expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();
});

test('with no events the grid shows no event rows or overflow counters', () => {
  renderScreen();
  expect(screen.queryByText(/^\+\d+$/)).toBeNull();
});

test('the furthest selectable year still lands on the month the bar shows', () => {
  renderScreen();
  const furthest = today.getFullYear() + calendarYearRadius;

  fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
  fireEvent.press(screen.getByRole('radio', { name: String(furthest) }));
  fireEvent.press(
    screen.getByRole('button', {
      name: `Select month, ${monthLabel(2026, 2)}`,
    }),
  );
  fireEvent.press(screen.getByRole('radio', { name: monthLabel(2026, 11) }));

  // The screen clamps into the pageable range, so a bar still showing December
  // of the furthest year proves the range covers whole years. That the grid
  // scrolled there cannot be asserted here: jest has no real scroll, so a
  // programmatically targeted page never renders. monthPaging.test.ts covers
  // the range arithmetic itself.
  expect(screen.getByText(String(furthest))).toBeOnTheScreen();
  expect(screen.getByText(monthLabel(furthest, 11))).toBeOnTheScreen();
});

/** Stands in for the header drawer, which lives in the navigator. */
function ViewSwitcher() {
  const { setView } = useCalendarActions();
  return (
    <>
      {(['day', 'week', 'month'] as const).map(view => (
        <Text
          key={view}
          accessibilityRole="button"
          onPress={() => setView(view)}
        >
          {`show ${view}`}
        </Text>
      ))}
    </>
  );
}

function renderWithSwitcher() {
  render(
    <CalendarNavigationProvider today={today}>
      <CalendarScreen />
      <ViewSwitcher />
    </CalendarNavigationProvider>,
  );
  fireEvent(screen.getByTestId('month-pager'), 'layout', {
    nativeEvent: { layout: { width: pageWidth, height: 600, x: 0, y: 0 } },
  });
}

function weekRowFor(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

describe('views stay on the same date', () => {
  test('a month reached by swiping is still the month the other views show', () => {
    renderWithSwitcher();
    swipeByMonths(1);

    fireEvent.press(screen.getByText('show week'));
    // April 17, not today: the focused day travelled with the swipe.
    expect(
      screen.getByText(weekRowFor(new Date(2026, 3, 17, 12))),
    ).toBeOnTheScreen();
  });

  test('a day tapped in the grid is the day the week view opens on', () => {
    renderWithSwitcher();
    fireEvent.press(
      screen.getByLabelText(
        new RegExp(
          `^${new Date(2026, 2, 26, 12).toLocaleDateString(undefined, {
            dateStyle: 'full',
          })}, `,
        ),
      ),
    );

    fireEvent.press(screen.getByText('show week'));
    expect(
      screen.getByText(weekRowFor(new Date(2026, 2, 26, 12))),
    ).toBeOnTheScreen();
  });

  test('a day in a neighbouring month carries the grid there too', () => {
    renderWithSwitcher();
    fireEvent.press(
      screen.getByLabelText(
        new RegExp(
          `^${new Date(2026, 3, 2, 12).toLocaleDateString(undefined, {
            dateStyle: 'full',
          })}, outside the displayed month`,
        ),
      ),
    );

    // The grid follows, because the visible month derives from the focused day.
    expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();

    fireEvent.press(screen.getByText('show week'));
    expect(
      screen.getByText(weekRowFor(new Date(2026, 3, 2, 12))),
    ).toBeOnTheScreen();
  });

  test('returning to the month view keeps the day reached elsewhere', () => {
    renderWithSwitcher();
    fireEvent.press(screen.getByText('show day'));
    expect(screen.getByTestId('calendar-view-day')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('show month'));
    expect(screen.getByText(monthLabel(2026, 2))).toBeOnTheScreen();
    expect(screen.getByTestId('calendar-view-month')).toBeOnTheScreen();
  });
});
