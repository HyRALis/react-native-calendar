import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CalendarEvent } from '../../types';
import { formatEventTime } from '../../utils/calendarEvents';
import { MonthDayCell } from './MonthDayCell';

const day = new Date(2026, 2, 17, 12);

function makeEvents(count: number): CalendarEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    title: `Standup number ${index} with a very long title`,
    start: new Date(2026, 2, 17, 8 + index),
  }));
}

function renderCell(
  overrides: Partial<React.ComponentProps<typeof MonthDayCell>> = {},
) {
  return render(
    <MonthDayCell
      day={day}
      events={[]}
      inCurrentMonth
      isToday={false}
      {...overrides}
    />,
  );
}

test('the header shows the date number', () => {
  renderCell();
  expect(screen.getByText('17')).toBeOnTheScreen();
});

test('pressing the tile reports its exact day', () => {
  const onPress = jest.fn();
  renderCell({ onPress });
  fireEvent.press(screen.getByRole('button'));
  expect(onPress).toHaveBeenCalledWith(day);
});

test('the body lists each event with its time and a truncated title', () => {
  const events = makeEvents(2);
  renderCell({ events });

  events.forEach(event => {
    const row = screen.getByText(
      `${formatEventTime(event.start)} ${event.title}`,
    );
    expect(row).toBeOnTheScreen();
    expect(row.props.numberOfLines).toBe(1);
  });
  expect(screen.queryByText(/^\+/)).toBeNull();
});

test('more events than fit collapse into a +n row', () => {
  renderCell({ events: makeEvents(5) });
  // Two events shown, the remaining three behind the counter: three rows total.
  expect(screen.getAllByText(/Standup number/)).toHaveLength(2);
  expect(screen.getByText('+3')).toBeOnTheScreen();
});

test('the accessible name carries the date, today and the full event count', () => {
  renderCell({ isToday: true, events: makeEvents(5) });
  expect(
    screen.getByLabelText(
      `${day.toLocaleDateString(undefined, {
        dateStyle: 'full',
      })}, today, 5 events`,
    ),
  ).toBeOnTheScreen();
});

test('an adjacent-month day says so and stays pressable', () => {
  const onPress = jest.fn();
  renderCell({ inCurrentMonth: false, onPress });
  const cell = screen.getByLabelText(
    `${day.toLocaleDateString(undefined, {
      dateStyle: 'full',
    })}, outside the displayed month, 0 events`,
  );
  fireEvent.press(cell);
  expect(onPress).toHaveBeenCalledWith(day);
});
