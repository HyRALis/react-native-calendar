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
  ).toBeOnTheScreen();
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

test('day shows an empty agenda when no events exist', () => {
  render(<CalendarViewContent view="day" date={date} />);
  expect(screen.getByText('No events yet')).toBeOnTheScreen();
});
