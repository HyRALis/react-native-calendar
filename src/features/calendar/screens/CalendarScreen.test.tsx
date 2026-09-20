import React from 'react';
import { Text } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import type { CalendarEvent, CalendarView } from '../types';
import { formatEventDateTime } from '../utils/calendarEvents';
import { formatPeriodLabel } from '../utils/calendarLabels';
import { indexOfDate, pageCount } from '../utils/calendarPaging';
import { CalendarNavigationProvider, useCalendarActions } from '../navigation';
import { createEventStore } from '../storage/eventStore';
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

function memoryStore() {
  const values = new Map<string, string>();

  return createEventStore({
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
  });
}

async function renderScreen(store = memoryStore(), getNow = () => today) {
  render(
    <CalendarNavigationProvider today={today}>
      <CalendarScreen eventStore={store} getNow={getNow} />
      <ViewSwitcher />
    </CalendarNavigationProvider>,
  );
  await act(async () => {});
  layOutPager('month');
}

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

test('the calendar fills the screen with no scrolling heading block', async () => {
  await renderScreen();
  expect(screen.queryByText('Your calendar')).toBeNull();
  expect(screen.getByTestId('calendar-view-month')).toHaveStyle({ flex: 1 });
});

test('with no events the grid shows no event rows or overflow counters', async () => {
  await renderScreen();
  expect(screen.queryByText(/^\+\d+$/)).toBeNull();
});

describe('every view pages the same way', () => {
  test('swiping the month grid moves a month at a time', async () => {
    await renderScreen();
    expect(screen.getByText(monthLabel(2026, 2))).toBeOnTheScreen();

    swipePages('month', 1);
    expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();

    swipePages('month', -1);
    expect(screen.getByText(monthLabel(2026, 1))).toBeOnTheScreen();
  });

  test('swiping the week view moves a week, keeping the weekday', async () => {
    await renderScreen();
    showView('week');

    swipePages('week', 1);
    expect(
      screen.getByText(periodLabel('week', new Date(2026, 2, 24))),
    ).toBeOnTheScreen();
  });

  test('swiping the day view moves a day at a time', async () => {
    await renderScreen();
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
  ] as const)('the next arrow steps one %s', async (view, expected) => {
    await renderScreen();
    showView(view);

    fireEvent.press(screen.getByRole('button', { name: `Next ${view}` }));

    expect(screen.getByText(periodLabel(view, expected))).toBeOnTheScreen();
  });

  test('the next arrow steps one month in the month view', async () => {
    await renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText(monthLabel(2026, 3))).toBeOnTheScreen();
  });

  test('the pickers and Today work from the day view', async () => {
    await renderScreen();
    showView('day');

    fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
    fireEvent.press(screen.getByRole('radio', { name: '2030' }));
    expect(
      screen.getByText(periodLabel('day', new Date(2030, 2, 17))),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByText(periodLabel('day', today))).toBeOnTheScreen();
  });

  test('the furthest selectable year still lands on the month the bar shows', async () => {
    await renderScreen();
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

describe('adding an event', () => {
  test('the floating button opens the add event sheet', async () => {
    await renderScreen();
    expect(screen.queryByRole('header', { name: 'Add event' })).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Add event' }));

    expect(screen.getByRole('header', { name: 'Add event' })).toBeOnTheScreen();
  });

  test('an event saved in the sheet shows up in the grid', async () => {
    await renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Add event' }));
    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
    fireEvent.press(screen.getByRole('button', { name: 'Save event' }));

    expect(screen.queryByRole('header', { name: 'Add event' })).toBeNull();
    expect(screen.getByText(/Standup$/)).toBeOnTheScreen();
  });

  test('an event saved in one session is still there in the next', async () => {
    const store = memoryStore();
    await renderScreen(store);

    fireEvent.press(screen.getByRole('button', { name: 'Add event' }));
    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
    fireEvent.press(screen.getByRole('button', { name: 'Save event' }));
    await act(async () => {});
    screen.unmount();

    await renderScreen(store);

    expect(screen.getByText(/Standup$/)).toBeOnTheScreen();
  }, 30000);

  test('cancelling leaves the grid empty', async () => {
    await renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Add event' }));
    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('header', { name: 'Add event' })).toBeNull();
    expect(screen.queryByText(/Standup$/)).toBeNull();
  });
});

describe('editing an event', () => {
  async function addStandup() {
    fireEvent.press(screen.getByRole('button', { name: 'Add event' }));
    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup');
    fireEvent.press(screen.getByRole('button', { name: 'Save event' }));
    await act(async () => {});
  }

  test('tapping an event opens its details, which offer to edit it', async () => {
    await renderScreen();
    await addStandup();

    fireEvent.press(screen.getByLabelText(/^Standup, /));

    expect(
      screen.getByRole('header', { name: 'Event details' }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Edit event' }),
    ).toBeOnTheScreen();
  });

  test('the form opens on the event and details give way to it', async () => {
    await renderScreen();
    await addStandup();

    fireEvent.press(screen.getByLabelText(/^Standup, /));
    fireEvent.press(screen.getByRole('button', { name: 'Edit event' }));

    expect(screen.queryByRole('header', { name: 'Event details' })).toBeNull();
    expect(
      screen.getByRole('header', { name: 'Edit event' }),
    ).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Standup')).toBeOnTheScreen();
  });

  test('a saved change replaces the event in the grid', async () => {
    await renderScreen();
    await addStandup();

    fireEvent.press(screen.getByLabelText(/^Standup, /));
    fireEvent.press(screen.getByRole('button', { name: 'Edit event' }));
    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup, moved');
    fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.queryByRole('header', { name: 'Edit event' })).toBeNull();
    expect(screen.getByText(/Standup, moved$/)).toBeOnTheScreen();
    expect(screen.queryByText('Standup')).toBeNull();
  });

  test('an edit made in one session is there in the next', async () => {
    const store = memoryStore();
    await renderScreen(store);
    await addStandup();

    fireEvent.press(screen.getByLabelText(/^Standup, /));
    fireEvent.press(screen.getByRole('button', { name: 'Edit event' }));
    fireEvent.changeText(screen.getByLabelText('Title'), 'Standup, moved');
    fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
    await act(async () => {});
    screen.unmount();

    await renderScreen(store);

    expect(screen.getByText(/Standup, moved$/)).toBeOnTheScreen();
    expect(screen.queryByText('Standup')).toBeNull();
  }, 30000);

  test('cancelling the form leaves the event as it was', async () => {
    await renderScreen();
    await addStandup();

    fireEvent.press(screen.getByLabelText(/^Standup, /));
    fireEvent.press(screen.getByRole('button', { name: 'Edit event' }));
    fireEvent.changeText(screen.getByLabelText('Title'), 'Discarded');
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Standup')).toBeOnTheScreen();
    expect(screen.queryByText('Discarded')).toBeNull();
  });
});

describe('views stay on the same date', () => {
  test('a month reached by swiping is the month the other views show', async () => {
    await renderScreen();
    swipePages('month', 1);

    showView('week');
    expect(
      screen.getByText(weekRowFor(new Date(2026, 3, 17, 12))),
    ).toBeOnTheScreen();
  });

  test('a day tapped in the grid is the day the week view opens on', async () => {
    await renderScreen();
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

  test('a day in a neighbouring month opens that day immediately', async () => {
    await renderScreen();
    fireEvent.press(
      screen.getByLabelText(
        new RegExp(
          `^${new Date(2026, 3, 2, 12).toLocaleDateString(undefined, {
            dateStyle: 'full',
          })}, outside the displayed month`,
        ),
      ),
    );

    expect(screen.getByTestId('calendar-view-day')).toBeOnTheScreen();
    expect(
      screen.getByText(periodLabel('day', new Date(2026, 3, 2))),
    ).toBeOnTheScreen();
  });

  test('a day chosen in the week view is where the day view opens', async () => {
    await renderScreen();
    showView('week');
    fireEvent.press(
      screen.getByLabelText(
        new Date(2026, 2, 19, 12).toLocaleDateString(undefined, {
          dateStyle: 'full',
        }),
      ),
    );

    expect(screen.getByTestId('calendar-view-day')).toBeOnTheScreen();
    expect(
      screen.getByText(periodLabel('day', new Date(2026, 2, 19))),
    ).toBeOnTheScreen();
  });

  test('a round trip through every view keeps the day swiped to', async () => {
    await renderScreen();
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

test.each(['month', 'week', 'day'] as const)(
  'an event in %s opens its full details without navigating away',
  async view => {
    const event: CalendarEvent = {
      id: 'details',
      title: 'A long event title that must remain complete in the day agenda',
      start: new Date(2026, 2, 17, 13),
      end: new Date(2026, 2, 18, 14),
      description: 'All of the notes\nIncluding another paragraph.',
    };
    const store = memoryStore();
    await store.save([event]);
    await renderScreen(store);
    if (view !== 'month') {
      showView(view);
    }
    fireEvent.press(
      screen.getAllByRole('button', {
        name: new RegExp(`^${event.title},`),
      })[0],
    );
    const sheet = screen.getByTestId('event-details-sheet');
    expect(within(sheet).getByText(event.title)).toBeOnTheScreen();
    expect(within(sheet).getByText(event.description!)).toBeOnTheScreen();
    expect(
      within(sheet).getByText(formatEventDateTime(event.start)),
    ).toBeOnTheScreen();
    expect(
      within(sheet).getByText(formatEventDateTime(event.end!)),
    ).toBeOnTheScreen();
    fireEvent.press(within(sheet).getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('event-details-sheet')).toBeNull();
    expect(screen.getByTestId(`calendar-view-${view}`)).toBeOnTheScreen();
  },
);

test('opening the add form reads a fresh clock each time', async () => {
  const getNow = jest.fn().mockReturnValue(today);
  await renderScreen(memoryStore(), getNow);
  fireEvent.press(screen.getByRole('button', { name: 'Add event' }));
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  const later = new Date(2026, 2, 17, 16, 30, 1);
  getNow.mockReturnValue(later);
  fireEvent.press(screen.getByRole('button', { name: 'Add event' }));
  expect(
    screen.getByRole('button', { name: 'Starts time' }),
  ).toHaveAccessibilityValue({
    text: new Date(2026, 2, 17, 16, 45).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  });
});
