import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CalendarActionsBar } from './CalendarActionsBar';

const month = new Date(2026, 2, 1, 12);
const today = new Date(2026, 6, 4, 12);

function label(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long' });
}

function renderBar() {
  const onChangeMonth = jest.fn();
  render(
    <CalendarActionsBar
      month={month}
      today={today}
      onChangeMonth={onChangeMonth}
    />,
  );
  return onChangeMonth;
}

function changedTo(onChangeMonth: jest.Mock) {
  const value = onChangeMonth.mock.calls[0][0] as Date;
  return [value.getFullYear(), value.getMonth()];
}

test('the bar shows the visible month and year', () => {
  renderBar();
  expect(screen.getByText(label(month))).toBeOnTheScreen();
  expect(screen.getByText('2026')).toBeOnTheScreen();
});

test.each([
  ['Next month', 2026, 3],
  ['Previous month', 2026, 1],
])('%s steps one month', (name, year, monthIndex) => {
  const onChangeMonth = renderBar();
  fireEvent.press(screen.getByRole('button', { name }));
  expect(changedTo(onChangeMonth)).toEqual([year, monthIndex]);
});

test('the month picker lists twelve months and keeps the year', () => {
  const onChangeMonth = renderBar();
  fireEvent.press(
    screen.getByRole('button', { name: `Select month, ${label(month)}` }),
  );
  expect(screen.getAllByRole('radio')).toHaveLength(12);
  expect(
    screen.getByRole('radio', { name: label(month), checked: true }),
  ).toBeOnTheScreen();

  fireEvent.press(
    screen.getByRole('radio', { name: label(new Date(2026, 6, 1)) }),
  );
  expect(changedTo(onChangeMonth)).toEqual([2026, 6]);
});

test('the year picker keeps the month', () => {
  const onChangeMonth = renderBar();
  fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
  expect(
    screen.getByRole('radio', { name: '2026', checked: true }),
  ).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('radio', { name: '2029' }));
  expect(changedTo(onChangeMonth)).toEqual([2029, 2]);
});

test('Today returns to the current month', () => {
  const onChangeMonth = renderBar();
  fireEvent.press(screen.getByRole('button', { name: 'Today' }));
  expect(changedTo(onChangeMonth)).toEqual([2026, 6]);
});

test('dismissing a picker changes nothing', () => {
  const onChangeMonth = renderBar();
  fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
  fireEvent.press(screen.getByRole('button', { name: 'Dismiss select year' }));
  expect(screen.queryByRole('radio', { name: '2029' })).toBeNull();
  expect(onChangeMonth).not.toHaveBeenCalled();
});
