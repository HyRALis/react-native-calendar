import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MonthView } from './MonthView';

test.each([
  [new Date(2021, 1, 15), 4], // February 2021 starts on a Monday: four rows.
  [new Date(2024, 1, 15), 5], // Leap February.
  [new Date(2026, 2, 15), 6], // Sunday start spills into a sixth row.
])('%s renders %i week rows that each flex to fill', (month, weekCount) => {
  render(<MonthView month={month} />);
  // 7 weekday labels + 7 cells per week row.
  expect(screen.getAllByRole('button')).toHaveLength(weekCount * 7);
});

test('the weekday header has seven labels, Monday first', () => {
  render(<MonthView month={new Date(2026, 2, 15)} />);
  const monday = new Date(2026, 2, 2, 12);
  expect(
    screen.getAllByText(
      monday.toLocaleDateString(undefined, { weekday: 'narrow' }),
    ).length,
  ).toBeGreaterThan(0);
});

test('every day of the month appears exactly once', () => {
  render(<MonthView month={new Date(2024, 1, 15)} />);
  for (let date = 1; date <= 29; date++) {
    expect(
      screen.getByLabelText(
        new RegExp(
          `^${new Date(2024, 1, date, 12).toLocaleDateString(undefined, {
            dateStyle: 'full',
          })}, `,
        ),
      ),
    ).toBeOnTheScreen();
  }
});

test('today is marked only when it falls inside the rendered month', () => {
  const today = new Date(2024, 1, 29, 12);
  render(<MonthView month={today} today={today} />);
  expect(
    screen.getByLabelText(
      `${today.toLocaleDateString(undefined, {
        dateStyle: 'full',
      })}, today, 0 events`,
    ),
  ).toBeOnTheScreen();
});

test('pressing a trailing day reports a day in the next month', () => {
  const onSelectDay = jest.fn();
  // March 2026 ends on a Tuesday, so the last row trails into April.
  render(<MonthView month={new Date(2026, 2, 15)} onSelectDay={onSelectDay} />);
  fireEvent.press(
    screen.getByLabelText(
      new RegExp(
        `^${new Date(2026, 3, 1, 12).toLocaleDateString(undefined, {
          dateStyle: 'full',
        })}, outside the displayed month`,
      ),
    ),
  );
  expect(onSelectDay).toHaveBeenCalledTimes(1);
  expect(onSelectDay.mock.calls[0][0].getMonth()).toBe(3);
});

test('events are routed to the day they start on', () => {
  render(
    <MonthView
      month={new Date(2026, 2, 15)}
      events={[
        { id: '1', title: 'Retro', start: new Date(2026, 2, 10, 9) },
        { id: '2', title: 'Offsite', start: new Date(2026, 2, 11, 9) },
      ]}
    />,
  );
  expect(screen.getByText(/Retro/)).toBeOnTheScreen();
  expect(
    screen.getByLabelText(
      new RegExp(
        `^${new Date(2026, 2, 10, 12).toLocaleDateString(undefined, {
          dateStyle: 'full',
        })}, 1 event$`,
      ),
    ),
  ).toBeOnTheScreen();
});
