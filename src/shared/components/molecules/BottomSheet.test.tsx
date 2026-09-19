import React from 'react';
import { Modal, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BottomSheet } from './BottomSheet';

function renderSheet(visible = true, dismissLabel?: string) {
  const onClose = jest.fn();
  render(
    <BottomSheet
      visible={visible}
      title="Add event"
      dismissLabel={dismissLabel}
      onClose={onClose}
    >
      <Text>Sheet body</Text>
    </BottomSheet>,
  );

  return { onClose };
}

test('renders nothing while hidden', () => {
  renderSheet(false);
  expect(screen.queryByText('Add event')).toBeNull();
  expect(screen.queryByText('Sheet body')).toBeNull();
});

test('announces the title as a heading above the content', () => {
  renderSheet();
  expect(screen.getByRole('header', { name: 'Add event' })).toBeOnTheScreen();
  expect(screen.getByText('Sheet body')).toBeOnTheScreen();
});

test.each([
  [
    'the backdrop',
    () => fireEvent.press(screen.getByLabelText('Dismiss add event')),
  ],
  [
    'Android back',
    () => fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'),
  ],
])('dismissing with %s closes the sheet', (_name, dismiss) => {
  const { onClose } = renderSheet();
  dismiss();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('the backdrop label can be given a friendlier name', () => {
  const { onClose } = renderSheet(true, 'Close the form');
  fireEvent.press(screen.getByLabelText('Close the form'));
  expect(onClose).toHaveBeenCalledTimes(1);
});
