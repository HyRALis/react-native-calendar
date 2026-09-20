import React, { createRef } from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormField } from './FormField';

test('connects label and helper text to the input and forwards changes', () => {
  const onChangeText = jest.fn();
  render(
    <FormField
      label="Email"
      helperText="Use your work email."
      required
      value=""
      onChangeText={onChangeText}
    />,
  );
  const input = screen.getByLabelText('Email');
  expect(input).toHaveProp(
    'accessibilityHint',
    'Required. Use your work email.',
  );
  expect(screen.getByText('Email *')).toBeOnTheScreen();
  fireEvent.changeText(input, 'person@example.com');
  expect(onChangeText).toHaveBeenCalledWith('person@example.com');
});

test('errors replace helper text and clear when validation recovers', () => {
  const { rerender } = render(
    <FormField
      label="Email"
      helperText="Use your work email."
      error="Enter a valid email."
      accessibilityHint="Double tap to edit."
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email.');
  expect(screen.queryByText('Use your work email.')).toBeNull();
  expect(screen.getByLabelText('Email')).toHaveProp(
    'accessibilityHint',
    'Enter a valid email. Double tap to edit.',
  );
  rerender(<FormField label="Email" helperText="Use your work email." />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('Use your work email.')).toBeOnTheScreen();
  expect(screen.getByLabelText('Email')).toHaveProp(
    'accessibilityHint',
    'Use your work email.',
  );
});

test('forwards the native input ref, custom style, and secure entry options', () => {
  const ref = createRef<React.ComponentRef<typeof NativeTextInput>>();
  const { unmount } = render(
    <FormField
      ref={ref}
      label="Password"
      accessibilityLabel="Account password"
      secureTextEntry
      style={{ marginTop: 10 }}
    />,
  );
  const input = screen.getByLabelText('Account password');
  expect(input).toHaveStyle({ marginTop: 10 });
  expect(input).toHaveProp('secureTextEntry', true);
  expect(ref.current).toBe(screen.UNSAFE_getByType(NativeTextInput).instance);
  expect(ref.current?.focus).toEqual(expect.any(Function));
  unmount();
  expect(ref.current).toBeNull();
});
