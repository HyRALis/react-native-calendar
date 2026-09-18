import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CalendarViewContent } from './CalendarViewContent';

const date = new Date(2024, 1, 29, 12);

test('month renders leap day and identifies today', () => {
  render(<CalendarViewContent view="month" date={date} today={date} />);
  expect(
    screen.getByLabelText(
      `${date.toLocaleDateString(undefined, {
        dateStyle: 'full',
      })}, today, 0 events`,
    ),
  ).toHaveTextContent('29');
});

test('month defaults to an empty schedule', () => {
  render(<CalendarViewContent view="month" date={date} today={date} />);
  expect(screen.queryByText(/^\+\d+$/)).toBeNull();
});

test('week renders seven daily sections', () => {
  render(<CalendarViewContent view="week" date={date} />);
  expect(screen.getAllByText('No events yet')).toHaveLength(7);
  expect(
    screen.getByText(
      date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    ),
  ).toBeOnTheScreen();
});

test('day renders all 24 hourly slots', () => {
  render(<CalendarViewContent view="day" date={date} />);
  for (let hour = 0; hour < 24; hour++) {
    const time = new Date(2024, 1, 29, hour);
    expect(
      screen.getByText(
        time.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }),
      ),
    ).toBeOnTheScreen();
  }
});
