import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/features/auth/AuthProvider';
import { RootNavigator } from '../src/app/navigation/RootNavigator';
import type { AuthService, AuthUser } from '../src/features/auth/types';

function setup(initialUser: AuthUser | null = null) {
  let emit: (user: AuthUser | null) => void = () => {};
  const unsubscribe = jest.fn();
  const user = { id: 'test-account', email: 'learner@example.com' };
  const service: AuthService = {
    subscribe: jest.fn(next => {
      emit = next;
      next(initialUser);
      return unsubscribe;
    }),
    signIn: jest.fn(async () => {
      emit(user);
    }),
    signUp: jest.fn(async () => {
      emit(user);
    }),
    signOut: jest.fn(async () => {
      emit(null);
    }),
    getIdToken: jest.fn(async () => 'test-only-token'),
  };
  const result = render(
    <SafeAreaProvider>
      <AuthProvider service={service}>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>,
  );
  return { service, unsubscribe, ...result };
}

function fillForm(password = 'password123') {
  fireEvent.changeText(screen.getByLabelText('Email'), 'learner@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), password);
}

test('invalid fields do not call Firebase', () => {
  const { service } = setup();
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Enter your email address.')).toBeOnTheScreen();
  expect(service.signIn).not.toHaveBeenCalled();
});

test('registration opens Calendar and Profile logout removes private screens', async () => {
  const { service } = setup();
  fireEvent.press(screen.getByRole('button', { name: 'Create an account' }));
  fillForm();
  fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  await screen.findByText('Your calendar');
  expect(service.signUp).toHaveBeenCalledWith({
    email: 'learner@example.com',
    password: 'password123',
  });
  fireEvent.press(screen.getByLabelText(/Profile, tab/));
  await screen.findByText('learner@example.com');
  fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  await screen.findByText('Welcome back');
  expect(service.signOut).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Your profile')).toBeNull();
  expect(screen.queryByText('Your calendar')).toBeNull();
});

test('sign-in failure stays on the form with a readable error', async () => {
  const { service } = setup();
  jest
    .mocked(service.signIn)
    .mockRejectedValueOnce({ code: 'auth/invalid-credential' });
  fillForm('wrong');
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText('The email or password is incorrect.');
  expect(screen.queryByText('Your calendar')).toBeNull();
});

test('restored Firebase user starts on Calendar and unsubscribes on unmount', () => {
  const { unmount, unsubscribe } = setup({
    id: 'restored',
    email: 'returning@example.com',
  });
  expect(screen.getByText('Your calendar')).toBeOnTheScreen();
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

test('blocks duplicate submissions while a sign-in request is pending', async () => {
  const { service } = setup();
  let finish!: () => void;
  jest.mocked(service.signIn).mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      }),
  );
  fillForm();
  const button = screen.getByRole('button', { name: 'Sign in' });
  fireEvent.press(button);
  fireEvent.press(button);
  expect(service.signIn).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
  });
  await waitFor(() => expect(button).not.toBeDisabled());
});

test('logout failure does not pretend the persisted session is cleared', async () => {
  const { service } = setup({ id: 'restored', email: 'returning@example.com' });
  jest
    .mocked(service.signOut)
    .mockRejectedValueOnce(new Error('storage failure'));
  fireEvent.press(screen.getByLabelText(/Profile, tab/));
  fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  await screen.findByText('Something went wrong. Please try again.');
  expect(screen.getByText('Your profile')).toBeOnTheScreen();
});
