import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors } from '../../theme';
import { TextInput } from './TextInput';

test('forwards text, focus, and blur events while updating focus feedback', () => {
  const onChangeText = jest.fn();
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  render(
    <TextInput
      accessibilityLabel="Name"
      onChangeText={onChangeText}
      onFocus={onFocus}
      onBlur={onBlur}
    />,
  );
  const input = screen.getByLabelText('Name');
  fireEvent.changeText(input, 'Planning');
  expect(onChangeText).toHaveBeenCalledWith('Planning');
  fireEvent(input, 'focus', { nativeEvent: {} });
  expect(onFocus).toHaveBeenCalledTimes(1);
  expect(input).toHaveStyle({ borderColor: colors.primary });
  fireEvent(input, 'blur', { nativeEvent: {} });
  expect(onBlur).toHaveBeenCalledTimes(1);
  expect(input).toHaveStyle({ borderColor: colors.border });
});

test('retains invalid feedback when focused and accepts caller styles', () => {
  render(
    <TextInput accessibilityLabel="Name" invalid style={{ marginTop: 10 }} />,
  );
  const input = screen.getByLabelText('Name');
  fireEvent(input, 'focus', { nativeEvent: {} });
  expect(input).toHaveStyle({ borderColor: colors.error, marginTop: 10 });
});

test.each([
  { disabled: true, editable: true, readOnly: false, 'aria-disabled': false },
  { editable: false },
  { readOnly: true },
  { accessibilityState: { disabled: true } },
  { 'aria-disabled': true },
])('does not allow editing an unavailable input: %j', props => {
  const onChangeText = jest.fn();
  render(
    <TextInput
      accessibilityLabel="Name"
      onChangeText={onChangeText}
      {...props}
    />,
  );
  const input = screen.getByLabelText('Name');
  expect(input).toHaveProp('editable', false);
  fireEvent.changeText(input, 'Changed');
  expect(onChangeText).not.toHaveBeenCalled();
});

test('supports multiline native inputs without replacing their props', () => {
  render(<TextInput accessibilityLabel="Notes" multiline numberOfLines={4} />);
  expect(screen.getByLabelText('Notes')).toHaveProp('multiline', true);
  expect(screen.getByLabelText('Notes')).toHaveStyle({
    textAlignVertical: 'top',
  });
});
