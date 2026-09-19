import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FloatingActionButton } from './FloatingActionButton';

test('presses through its accessible name', () => {
  const onPress = jest.fn();
  render(
    <FloatingActionButton accessibilityLabel="Add event" onPress={onPress} />,
  );

  fireEvent.press(screen.getByRole('button', { name: 'Add event' }));

  expect(onPress).toHaveBeenCalledTimes(1);
});

test('floats over the bottom-right corner of its parent', () => {
  render(<FloatingActionButton accessibilityLabel="Add event" />);

  expect(screen.getByRole('button', { name: 'Add event' })).toHaveStyle({
    position: 'absolute',
  });
});

test('does not press while disabled', () => {
  const onPress = jest.fn();
  render(
    <FloatingActionButton
      accessibilityLabel="Add event"
      disabled
      onPress={onPress}
    />,
  );

  const button = screen.getByRole('button', { name: 'Add event' });
  fireEvent.press(button);

  expect(onPress).not.toHaveBeenCalled();
  expect(button).toBeDisabled();
});

test('takes a different glyph without changing its name', () => {
  render(<FloatingActionButton accessibilityLabel="Add event" glyph="✎" />);

  expect(screen.getByRole('button', { name: 'Add event' })).toBeOnTheScreen();
  expect(screen.getByText('✎')).toBeOnTheScreen();
});
