import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CalendarView } from '../types';
import { formatPeriodLabel } from '../utils/calendarLabels';
import { indexOfDate, pageCount } from '../utils/calendarPaging';
import { CalendarNavigationProvider, useCalendarActions } from '../navigation';
import { CalendarScreen } from './CalendarScreen';

const today = new Date(2026, 2, 17, 12);
const pageWidth = 300;

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1, 12).toLocaleDateString(undefined, {
    month: 'long',
  });
}

function periodLabel(view: CalendarView, date: Date) {
  return formatPeriodLabel(view, date) as string;
}

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

function layOutPager(view: CalendarView) {
  fireEvent(screen.getByTestId(`${view}-pager`), 'layout', {
    nativeEvent: { layout: { width: pageWidth, height: 600, x: 0, y: 0 } },
  });
}

function renderScreen() {
  render(
    <CalendarNavigationProvider today={today}>
      <CalendarScreen />
      <ViewSwitcher />
    </CalendarNavigationProvider>,
  );
  layOutPager('month');
}

/** Swipe `delta` pages in whichever view is showing, from today's page. */
function swipePages(view: CalendarView, delta: number) {
  const from = indexOfDate(view, today, today);
  const count = pageCount(view, today);

  fireEvent(screen.getByTestId(`${view}-pager`), 'momentumScrollEnd', {
    nativeEvent: {
      contentOffset: { x: (from + delta) * pageWidth, y: 0 },
      layoutMeasurement: { width: pageWidth, height: 600 },
      contentSize: { width: count * pageWidth, height: 600 },
    },
  });
}

function showView(view: CalendarView) {
  fireEvent.press(screen.getByText(`show ${view}`));
  layOutPager(view);
}

function weekRowFor(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

test('the calendar fills the screen with no scrolling heading block', () => {
  renderScreen();
  expect(screen.queryByText('Your calendar')).toBeNull();
  expect(screen.getByTestId('calendar-view-month')).toHaveStyle({ flex: 1 });
});

test('with no events the grid shows no event rows or overflow counters', () => {
  renderScreen();
  expect(screen.queryByText(/^\+\d+$/)).toBeNull();
});

describe('every view pages the same way', () => {
  test('swiping the month grid moves a month at a time', () => {
    renderScreen();
    expect(screen.getByText(monthLabel(2026, 2))).toBeOnTheScreen();

    swipePages('month', 1);
    expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();

    swipePages('month', -1);
    expect(screen.getByText(monthLabel(2026, 1))).toBeOnTheScreen();
  });

  test('swiping the week view moves a week, keeping the weekday', () => {
    renderScreen();
    showView('week');

    swipePages('week', 1);
    // 17 March is a Tuesday; one week on is Tuesday 24 March. Only the bar is
    // asserted: jest has no real scroll, so the page the swipe targeted is not
    // rendered until the pager remounts. The cross-view tests below cover the
    // page contents, because switching view does remount it.
    expect(
      screen.getByText(periodLabel('week', new Date(2026, 2, 24))),
    ).toBeOnTheScreen();
  });

  test('swiping the day view moves a day at a time', () => {
    renderScreen();
    showView('day');

    swipePages('day', 1);
    expect(
      screen.getByText(periodLabel('day', new Date(2026, 2, 18))),
    ).toBeOnTheScreen();

    swipePages('day', -2);
    expect(
      screen.getByText(periodLabel('day', new Date(2026, 2, 15))),
    ).toBeOnTheScreen();
  });
});

describe('the actions bar drives every view', () => {
  test.each([
    ['day', new Date(2026, 2, 18)],
    ['week', new Date(2026, 2, 24)],
  ] as const)('the next arrow steps one %s', (view, expected) => {
    renderScreen();
    showView(view);

    fireEvent.press(screen.getByRole('button', { name: `Next ${view}` }));

    expect(screen.getByText(periodLabel(view, expected))).toBeOnTheScreen();
  });

  test('the next arrow steps one month in the month view', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();
  });

  test('the pickers and Today work from the day view', () => {
    renderScreen();
    showView('day');

    fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
    fireEvent.press(screen.getByRole('radio', { name: '2030' }));
    expect(
      screen.getByText(periodLabel('day', new Date(2030, 2, 17))),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByText(periodLabel('day', today))).toBeOnTheScreen();
  });

  test('the furthest selectable year still lands on the month the bar shows', () => {
    renderScreen();
    const furthest = today.getFullYear() + 10;

    fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
    fireEvent.press(screen.getByRole('radio', { name: String(furthest) }));
    fireEvent.press(
      screen.getByRole('button', {
        name: `Select month, ${monthLabel(2026, 2)}`,
      }),
    );
    fireEvent.press(screen.getByRole('radio', { name: monthLabel(2026, 11) }));

    expect(screen.getByText(String(furthest))).toBeOnTheScreen();
    expect(screen.getByText(monthLabel(furthest, 11))).toBeOnTheScreen();
  });
});

describe('views stay on the same date', () => {
  test('a month reached by swiping is the month the other views show', () => {
    renderScreen();
    swipePages('month', 1);

    showView('week');
    expect(
      screen.getByText(weekRowFor(new Date(2026, 3, 17, 12))),
    ).toBeOnTheScreen();
  });

  test('a day tapped in the grid is the day the week view opens on', () => {
    renderScreen();
    fireEvent.press(
      screen.getByLabelText(
        new RegExp(
          `^${new Date(2026, 2, 26, 12).toLocaleDateString(undefined, {
            dateStyle: 'full',
          })}, `,
        ),
      ),
    );

    showView('week');
    expect(
      screen.getByText(weekRowFor(new Date(2026, 2, 26, 12))),
    ).toBeOnTheScreen();
  });

  test('a day in a neighbouring month carries the grid there too', () => {
    renderScreen();
    fireEvent.press(
      screen.getByLabelText(
        new RegExp(
          `^${new Date(2026, 3, 2, 12).toLocaleDateString(undefined, {
            dateStyle: 'full',
          })}, outside the displayed month`,
        ),
      ),
    );

    expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();
  });

  test('a day chosen in the week view is where the day view opens', () => {
    renderScreen();
    showView('week');
    fireEvent.press(
      screen.getByLabelText(
        new Date(2026, 2, 19, 12).toLocaleDateString(undefined, {
          dateStyle: 'full',
        }),
      ),
    );

    showView('day');
    expect(
      screen.getByText(periodLabel('day', new Date(2026, 2, 19))),
    ).toBeOnTheScreen();
  });

  test('a round trip through every view keeps the day swiped to', () => {
    renderScreen();
    showView('day');
    swipePages('day', 4);

    showView('week');
    showView('month');
    showView('day');

    expect(
      screen.getByText(periodLabel('day', new Date(2026, 2, 21))),
    ).toBeOnTheScreen();
  });
});
