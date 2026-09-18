import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';

test('exposes its label and forwards press events', () => {
  const onPress = jest.fn();
  render(<Button title="Save meeting" onPress={onPress} />);
  fireEvent.press(screen.getByRole('button', { name: 'Save meeting' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test.each([
  { disabled: true },
  { loading: true },
  { accessibilityState: { disabled: true } },
  { 'aria-disabled': true },
])('prevents interaction when unavailable: %j', props => {
  const onPress = jest.fn();
  render(<Button title="Save" onPress={onPress} {...props} />);
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeDisabled();
  fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('keeps its visible label while busy and becomes usable when loading ends', () => {
  const onPress = jest.fn();
  const { rerender } = render(
    <Button
      title="Save"
      onPress={onPress}
      loading
      aria-disabled={false}
      aria-busy={false}
    />,
  );
  expect(screen.getByText('Save')).toBeOnTheScreen();
  expect(screen.getByRole('button', { busy: true })).toBeDisabled();
  rerender(<Button title="Save" onPress={onPress} />);
  const button = screen.getByRole('button', { busy: false });
  expect(button).not.toBeDisabled();
  fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('supports custom accessible labels and caller styles alongside variants', () => {
  render(
    <Button
      title="Remove"
      accessibilityLabel="Remove meeting"
      variant="danger"
      size="sm"
      style={() => ({ marginTop: 10 })}
    />,
  );
  expect(screen.getByRole('button', { name: 'Remove meeting' })).toHaveStyle({
    minHeight: 44,
    marginTop: 10,
  });
});
