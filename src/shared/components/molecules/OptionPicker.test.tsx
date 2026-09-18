import React from 'react';
import { Modal } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OptionPicker } from './OptionPicker';

const options = [
  { value: 'a', label: 'Apples' },
  { value: 'b', label: 'Bananas' },
];

function renderPicker(visible = true) {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  render(
    <OptionPicker
      visible={visible}
      title="Pick fruit"
      options={options}
      selectedValue="b"
      onSelect={onSelect}
      onClose={onClose}
    />,
  );
  return { onSelect, onClose };
}

test('renders nothing while hidden', () => {
  renderPicker(false);
  expect(screen.queryByText('Pick fruit')).toBeNull();
});

test('marks only the selected option', () => {
  renderPicker();
  expect(screen.getAllByRole('radio')).toHaveLength(2);
  expect(
    screen.getByRole('radio', { name: 'Bananas', checked: true }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('radio', { name: 'Apples', checked: false }),
  ).toBeOnTheScreen();
});

test('choosing an option reports its value', () => {
  const { onSelect } = renderPicker();
  fireEvent.press(screen.getByRole('radio', { name: 'Apples' }));
  expect(onSelect).toHaveBeenCalledWith('a');
});

test.each([
  [
    'backdrop',
    () => fireEvent.press(screen.getByLabelText('Dismiss pick fruit')),
  ],
  [
    'Android back',
    () => fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'),
  ],
  [
    'the cancel button',
    () => fireEvent.press(screen.getByRole('button', { name: 'Cancel' })),
  ],
])('dismissing with %s closes without selecting', (_name, dismiss) => {
  const { onSelect, onClose } = renderPicker();
  dismiss();
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSelect).not.toHaveBeenCalled();
});
