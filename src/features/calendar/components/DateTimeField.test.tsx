import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { formatTimeOfDay } from '../utils/timeOfDay';
import { DateTimeField } from './DateTimeField';

const value = new Date(2026, 2, 17, 9, 30);

function dateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function renderField(error?: string) {
  const onChange = jest.fn();
  render(
    <DateTimeField
      label="Starts"
      value={value}
      today={value}
      error={error}
      onChange={onChange}
    />,
  );

  return { onChange };
}

test('shows the day and the time it holds', () => {
  renderField();

  expect(screen.getByText(dateLabel(value))).toBeOnTheScreen();
  expect(screen.getByText(formatTimeOfDay(9 * 60 + 30))).toBeOnTheScreen();
});

test('both halves are separately labelled buttons', () => {
  renderField();

  expect(screen.getByRole('button', { name: 'Starts date' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Starts time' })).toBeOnTheScreen();
});

test('choosing a new day keeps the time of day', () => {
  const { onChange } = renderField();

  fireEvent.press(screen.getByRole('button', { name: 'Starts date' }));
  fireEvent.press(
    screen.getByRole('button', {
      name: new Date(2026, 2, 26, 12).toLocaleDateString(undefined, {
        dateStyle: 'full',
      }),
    }),
  );

  expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 26, 9, 30));
});

test('choosing a new time keeps the day', () => {
  const { onChange } = renderField();

  fireEvent.press(screen.getByRole('button', { name: 'Starts time' }));
  fireEvent.press(
    screen.getByRole('radio', { name: formatTimeOfDay(14 * 60) }),
  );

  expect(onChange).toHaveBeenCalledWith(new Date(2026, 2, 17, 14, 0));
});

test('the time list opens on the time already set', () => {
  renderField();

  fireEvent.press(screen.getByRole('button', { name: 'Starts time' }));

  expect(
    screen.getByRole('radio', {
      name: formatTimeOfDay(9 * 60 + 30),
      checked: true,
    }),
  ).toBeOnTheScreen();
});

test('a picker closes again without reporting a change', () => {
  const { onChange } = renderField();

  fireEvent.press(screen.getByRole('button', { name: 'Starts date' }));
  fireEvent.press(screen.getByLabelText('Dismiss starts date'));

  expect(screen.queryByRole('button', { name: 'Show next month' })).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

test('an error is announced next to the field', () => {
  renderField('The end must come after the start.');

  expect(
    screen.getByRole('alert', { name: 'The end must come after the start.' }),
  ).toBeOnTheScreen();
});

describe('a floor on how early the field may go', () => {
  function renderFloored(min: Date) {
    const onChange = jest.fn();
    render(
      <DateTimeField
        label="Starts"
        value={value}
        today={value}
        min={min}
        onChange={onChange}
      />,
    );

    return { onChange };
  }

  test('earlier days cannot be picked', () => {
    renderFloored(value);

    fireEvent.press(screen.getByRole('button', { name: 'Starts date' }));

    expect(
      screen.getByRole('button', {
        name: new Date(2026, 2, 16, 12).toLocaleDateString(undefined, {
          dateStyle: 'full',
        }),
      }),
    ).toBeDisabled();
  });

  test('earlier times on the floor day are not offered', () => {
    renderFloored(new Date(2026, 2, 17, 9, 30));

    fireEvent.press(screen.getByRole('button', { name: 'Starts time' }));

    expect(
      screen.queryByRole('radio', { name: formatTimeOfDay(8 * 60) }),
    ).toBeNull();
    expect(
      screen.getByRole('radio', { name: formatTimeOfDay(10 * 60) }),
    ).toBeOnTheScreen();
  });

  test('a slot that has passed by seconds is not offered', () => {
    renderFloored(new Date(2026, 2, 17, 9, 15, 1));
    fireEvent.press(screen.getByRole('button', { name: 'Starts time' }));
    expect(
      screen.queryByRole('radio', { name: formatTimeOfDay(9 * 60 + 15) }),
    ).toBeNull();
    expect(
      screen.getByRole('radio', { name: formatTimeOfDay(9 * 60 + 30) }),
    ).toBeOnTheScreen();
  });

  test('the whole day is offered once the field moves past the floor day', () => {
    const onChange = jest.fn();
    render(
      <DateTimeField
        label="Starts"
        value={new Date(2026, 2, 26, 9, 30)}
        min={new Date(2026, 2, 17, 9, 30)}
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Starts time' }));

    expect(
      screen.getByRole('radio', { name: formatTimeOfDay(8 * 60) }),
    ).toBeOnTheScreen();
  });
});
