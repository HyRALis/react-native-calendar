import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DatePickerSheet } from './DatePickerSheet';

const value = new Date(2026, 2, 17, 12);

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { dateStyle: 'full' });
}

function renderSheet() {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  render(
    <DatePickerSheet
      title="Starts date"
      value={value}
      today={value}
      onSelect={onSelect}
      onClose={onClose}
    />,
  );

  return { onSelect, onClose };
}

test('opens on the month of the date being edited', () => {
  renderSheet();

  expect(
    screen.getByRole('header', { name: monthLabel(value) }),
  ).toBeOnTheScreen();
});

test('marks the day being edited as selected', () => {
  renderSheet();

  expect(
    screen.getByRole('button', { name: dayLabel(value), selected: true }),
  ).toBeOnTheScreen();
});

test.each([
  ['Show next month', new Date(2026, 3, 1, 12)],
  ['Show previous month', new Date(2026, 1, 1, 12)],
])('%s moves the grid a month', (action, expected) => {
  renderSheet();

  fireEvent.press(screen.getByRole('button', { name: action }));

  expect(
    screen.getByRole('header', { name: monthLabel(expected) }),
  ).toBeOnTheScreen();
});

test('choosing a day reports it anchored at midday', () => {
  const { onSelect } = renderSheet();
  const chosen = new Date(2026, 2, 26, 12);

  fireEvent.press(screen.getByRole('button', { name: dayLabel(chosen) }));

  expect(onSelect).toHaveBeenCalledWith(chosen);
});

test('a day from a neighbouring month can still be chosen', () => {
  const { onSelect } = renderSheet();
  const chosen = new Date(2026, 3, 2, 12);

  fireEvent.press(screen.getByRole('button', { name: dayLabel(chosen) }));

  expect(onSelect).toHaveBeenCalledWith(chosen);
});

test('the backdrop closes without choosing anything', () => {
  const { onSelect, onClose } = renderSheet();

  fireEvent.press(screen.getByLabelText('Dismiss starts date'));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSelect).not.toHaveBeenCalled();
});

test('days before the floor cannot be chosen', () => {
  const onSelect = jest.fn();
  render(
    <DatePickerSheet
      title="Starts date"
      value={value}
      today={value}
      minDate={value}
      onSelect={onSelect}
      onClose={jest.fn()}
    />,
  );

  const yesterday = screen.getByRole('button', {
    name: dayLabel(new Date(2026, 2, 16, 12)),
  });
  fireEvent.press(yesterday);

  expect(yesterday).toBeDisabled();
  expect(onSelect).not.toHaveBeenCalled();
});

test('the floor day itself and everything after it stay choosable', () => {
  const onSelect = jest.fn();
  render(
    <DatePickerSheet
      title="Starts date"
      value={value}
      today={value}
      minDate={value}
      onSelect={onSelect}
      onClose={jest.fn()}
    />,
  );

  fireEvent.press(screen.getByRole('button', { name: dayLabel(value) }));
  expect(onSelect).toHaveBeenCalledWith(value);

  const later = new Date(2026, 2, 26, 12);
  fireEvent.press(screen.getByRole('button', { name: dayLabel(later) }));
  expect(onSelect).toHaveBeenCalledWith(later);
});

test('the floor is a day, not a moment, so its own morning is not excluded', () => {
  const onSelect = jest.fn();
  render(
    <DatePickerSheet
      title="Starts date"
      value={value}
      minDate={new Date(2026, 2, 17, 23, 30)}
      onSelect={onSelect}
      onClose={jest.fn()}
    />,
  );

  fireEvent.press(screen.getByRole('button', { name: dayLabel(value) }));

  expect(onSelect).toHaveBeenCalledWith(value);
});
