import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Checkbox } from './Checkbox';
import { Switch } from './Switch';

test('checkbox requests a change but only updates when its controlled value changes', () => {
  const onValueChange = jest.fn();
  const { rerender } = render(
    <Checkbox
      accessibilityLabel="All day"
      checked={false}
      onValueChange={onValueChange}
    />,
  );
  fireEvent.press(
    screen.getByRole('checkbox', { name: 'All day', checked: false }),
  );
  expect(onValueChange).toHaveBeenLastCalledWith(true);
  expect(screen.getByRole('checkbox', { checked: false })).toBeOnTheScreen();
  rerender(
    <Checkbox
      accessibilityLabel="All day"
      checked
      onValueChange={onValueChange}
    />,
  );
  fireEvent.press(screen.getByRole('checkbox', { checked: true }));
  expect(onValueChange).toHaveBeenLastCalledWith(false);
});

test('disabled checkbox does not request changes or expose conflicting state', () => {
  const onValueChange = jest.fn();
  render(
    <Checkbox
      accessibilityLabel="All day"
      checked
      disabled
      aria-disabled={false}
      aria-checked={false}
      onValueChange={onValueChange}
    />,
  );
  const checkbox = screen.getByRole('checkbox', { checked: true });
  expect(checkbox).toBeDisabled();
  fireEvent.press(checkbox);
  expect(onValueChange).not.toHaveBeenCalled();
});

test('switch forwards value changes and reflects its controlled state', () => {
  const onValueChange = jest.fn();
  const { rerender } = render(
    <Switch
      accessibilityLabel="Reminders"
      value={false}
      onValueChange={onValueChange}
    />,
  );
  fireEvent(
    screen.getByRole('switch', { checked: false }),
    'valueChange',
    true,
  );
  expect(onValueChange).toHaveBeenCalledWith(true);
  expect(screen.getByRole('switch', { checked: false })).toBeOnTheScreen();
  rerender(
    <Switch
      accessibilityLabel="Reminders"
      value
      onValueChange={onValueChange}
    />,
  );
  expect(screen.getByRole('switch', { checked: true })).toBeOnTheScreen();
});

test('disabled switch does not request a change', () => {
  const onValueChange = jest.fn();
  render(
    <Switch
      accessibilityLabel="Reminders"
      value
      disabled
      onValueChange={onValueChange}
    />,
  );
  const control = screen.getByRole('switch', { name: 'Reminders' });
  expect(control).toBeDisabled();
  fireEvent(control, 'valueChange', false);
  expect(onValueChange).not.toHaveBeenCalled();
});
