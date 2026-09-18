import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CalendarView } from '../types';
import { formatPeriodLabel } from '../utils/calendarLabels';
import { CalendarActionsBar } from './CalendarActionsBar';

const month = new Date(2026, 2, 1, 12);
const focusedDate = new Date(2026, 2, 18, 12);
const today = new Date(2026, 6, 4, 12);

function label(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long' });
}

function renderBar(view: CalendarView = 'month') {
  const handlers = {
    onChangeMonth: jest.fn(),
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onToday: jest.fn(),
  };
  render(
    <CalendarActionsBar
      view={view}
      month={month}
      focusedDate={focusedDate}
      today={today}
      {...handlers}
    />,
  );
  return handlers;
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

test.each(['day', 'week', 'month'] as const)(
  'the %s view labels its arrows with the unit one step moves',
  view => {
    const { onPrevious, onNext } = renderBar(view);

    fireEvent.press(screen.getByRole('button', { name: `Previous ${view}` }));
    fireEvent.press(screen.getByRole('button', { name: `Next ${view}` }));

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  },
);

test.each(['day', 'week'] as const)(
  'the %s view names the exact period in focus',
  view => {
    renderBar(view);
    expect(
      screen.getByText(formatPeriodLabel(view, focusedDate) as string),
    ).toBeOnTheScreen();
  },
);

test('the month view needs no period line', () => {
  renderBar('month');
  expect(screen.queryByText(/–/)).toBeNull();
});

test.each(['day', 'week', 'month'] as const)(
  'the month picker works in the %s view and keeps the year',
  view => {
    const { onChangeMonth } = renderBar(view);
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
  },
);

test('the year picker keeps the month', () => {
  const { onChangeMonth } = renderBar();
  fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
  expect(
    screen.getByRole('radio', { name: '2026', checked: true }),
  ).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('radio', { name: '2029' }));
  expect(changedTo(onChangeMonth)).toEqual([2029, 2]);
});

test('Today is offered in every view', () => {
  const { onToday } = renderBar('day');
  fireEvent.press(screen.getByRole('button', { name: 'Today' }));
  expect(onToday).toHaveBeenCalledTimes(1);
});

test('dismissing a picker changes nothing', () => {
  const { onChangeMonth } = renderBar();
  fireEvent.press(screen.getByRole('button', { name: 'Select year, 2026' }));
  fireEvent.press(screen.getByRole('button', { name: 'Dismiss select year' }));
  expect(screen.queryByRole('radio', { name: '2029' })).toBeNull();
  expect(onChangeMonth).not.toHaveBeenCalled();
});
