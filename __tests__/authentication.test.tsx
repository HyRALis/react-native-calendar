import React from 'react';
import { AppState, Modal } from 'react-native';
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
import { appStorage } from '../src/shared/storage/appStorage';
import {
  eventsStorageKey,
  serializeEvents,
} from '../src/features/calendar/storage/eventStore';

beforeEach(() => {
  jest.useFakeTimers();
  AppState.currentState = 'active';
});
afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

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
      return user;
    }),
    signUp: jest.fn(async () => {
      emit(user);
      return user;
    }),
    signOut: jest.fn(async () => {
      emit(null);
    }),
    getIdToken: jest.fn(async () => 'test-only-token'),
  };
  const biometrics = {
    availability: jest.fn(async () => 'Biometrics'),
    isEnabled: jest.fn(async () => true),
    setEnabled: jest.fn(async () => {}),
    authenticate: jest.fn(async () => true),
    cancel: jest.fn(),
  };
  const result = render(
    <SafeAreaProvider>
      <AuthProvider service={service} biometrics={biometrics}>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>,
  );
  return {
    service,
    biometrics,
    unsubscribe,
    emit: (next: AuthUser | null) => emit(next),
    ...result,
  };
}

async function setupUnlocked() {
  const result = setup({ id: 'restored', email: 'returning@example.com' });
  fireEvent.press(
    await screen.findByRole('button', { name: 'Unlock with Biometrics' }),
  );
  await screen.findByTestId('calendar-view-month');
  return result;
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
  await screen.findByTestId('calendar-view-month');
  expect(service.signUp).toHaveBeenCalledWith({
    email: 'learner@example.com',
    password: 'password123',
  });
  fireEvent.press(screen.getByLabelText('Profile'));
  await screen.findByText('learner@example.com');
  fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  await screen.findByText('Welcome back');
  expect(service.signOut).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Your profile')).toBeNull();
  expect(screen.queryByTestId('calendar-view-month')).toBeNull();
});

test('sign-in failure stays on the form with a readable error', async () => {
  const { service } = setup();
  jest
    .mocked(service.signIn)
    .mockRejectedValueOnce({ code: 'auth/invalid-credential' });
  fillForm('wrong');
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText('The email or password is incorrect.');
  expect(screen.queryByTestId('calendar-view-month')).toBeNull();
});

test('restored Firebase user must unlock before Calendar and unsubscribes on unmount', async () => {
  const { unmount, unsubscribe } = setup({
    id: 'restored',
    email: 'returning@example.com',
  });
  expect(screen.queryByTestId('calendar-view-month')).toBeNull();
  expect(screen.queryByLabelText('Profile')).toBeNull();
  fireEvent.press(
    await screen.findByRole('button', { name: 'Unlock with Biometrics' }),
  );
  await screen.findByTestId('calendar-view-month');
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

test('blocks duplicate submissions while a sign-in request is pending', async () => {
  const { service } = setup();
  let finish!: (user: AuthUser) => void;
  jest.mocked(service.signIn).mockImplementationOnce(
    () =>
      new Promise<AuthUser>(resolve => {
        finish = resolve;
      }),
  );
  fillForm();
  const button = screen.getByRole('button', { name: 'Sign in' });
  fireEvent.press(button);
  fireEvent.press(button);
  expect(service.signIn).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish({ id: 'test-account', email: 'learner@example.com' });
  });
  await screen.findByTestId('calendar-view-month');
});

test('logout failure does not pretend the persisted session is cleared', async () => {
  const { service } = await setupUnlocked();
  jest
    .mocked(service.signOut)
    .mockRejectedValueOnce(new Error('storage failure'));
  fireEvent.press(screen.getByLabelText('Profile'));
  fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  await screen.findByText(
    'Sign-out could not finish. Your calendar is locked. Try again.',
  );
  expect(screen.queryByText('Your profile')).toBeNull();
  expect(screen.queryByTestId('calendar-view-month')).toBeNull();
});

test('calendar header opens the drawer and switches between all three views', async () => {
  await setupUnlocked();
  expect(screen.getByRole('header', { name: 'Calendar' })).toBeOnTheScreen();
  expect(screen.getByTestId('calendar-view-month')).toBeOnTheScreen();

  for (const view of ['Day', 'Week', 'Month']) {
    fireEvent.press(screen.getByRole('button', { name: 'Open calendar menu' }));
    expect(
      screen.getByRole('header', { name: 'Calendar views' }),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('radio', { name: view }));
    expect(screen.queryByText('Calendar views')).toBeNull();
    expect(
      screen.getByTestId(`calendar-view-${view.toLowerCase()}`),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Open calendar menu' }));
    expect(
      screen.getByRole('radio', { name: view, checked: true }),
    ).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Close menu' }));
  }
});

test('drawer closes with backdrop and Android back without changing the view', async () => {
  await setupUnlocked();
  fireEvent.press(screen.getByRole('button', { name: 'Open calendar menu' }));
  fireEvent.press(
    screen.getByRole('button', { name: 'Dismiss calendar menu' }),
  );
  expect(screen.queryByText('Calendar views')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Open calendar menu' }));
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(screen.queryByText('Calendar views')).toBeNull();
  expect(screen.getByTestId('calendar-view-month')).toBeOnTheScreen();
});

test('view selection survives tab changes and the Profile menu returns to Calendar', async () => {
  await setupUnlocked();
  fireEvent.press(screen.getByRole('button', { name: 'Open calendar menu' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Week' }));
  fireEvent.press(screen.getByLabelText('Profile'));
  expect(screen.getByRole('header', { name: 'Profile' })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Open calendar menu' }));
  expect(
    screen.getByRole('radio', { name: 'Week', checked: true }),
  ).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('radio', { name: 'Day' }));
  expect(screen.getByRole('header', { name: 'Calendar' })).toBeOnTheScreen();
  expect(screen.getByTestId('calendar-view-day')).toBeOnTheScreen();
  expect(screen.queryByText('Calendar views')).toBeNull();
});

test('logout clears the calendar view preference for the next session', async () => {
  await setupUnlocked();
  fireEvent.press(screen.getByRole('button', { name: 'Open calendar menu' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Day' }));
  fireEvent.press(screen.getByLabelText('Profile'));
  fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  await screen.findByText('Welcome back');
  expect(
    screen.queryByRole('button', { name: 'Open calendar menu' }),
  ).toBeNull();
  fillForm();
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByTestId('calendar-view-month');
});

test('cancelled biometrics keeps private screens absent and password fallback works', async () => {
  const { biometrics, service } = setup({
    id: 'restored',
    email: 'returning@example.com',
  });
  biometrics.authenticate.mockResolvedValueOnce(false);
  fireEvent.press(
    await screen.findByRole('button', { name: 'Unlock with Biometrics' }),
  );
  await screen.findByText(
    'Authentication was cancelled. Try again or use your password.',
  );
  expect(screen.queryByLabelText('Profile')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Use password' }));
  await screen.findByText('Welcome back');
  expect(biometrics.setEnabled).toHaveBeenCalledWith('restored', false);
  expect(service.signOut).toHaveBeenCalledTimes(1);
  fillForm();
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByTestId('calendar-view-month');
});

test('Profile can disable and enable biometric sign-in', async () => {
  const { biometrics } = await setupUnlocked();
  fireEvent.press(screen.getByLabelText('Profile'));
  fireEvent.press(
    await screen.findByRole('button', { name: 'Disable biometrics' }),
  );
  fireEvent.press(
    await screen.findByRole('button', { name: 'Enable biometrics' }),
  );
  await waitFor(() =>
    expect(biometrics.setEnabled).toHaveBeenLastCalledWith('restored', true),
  );
  expect(biometrics.authenticate).toHaveBeenCalledTimes(2);
});

test('backgrounding removes private screens and foregrounding requires unlock', async () => {
  const listen = jest.mocked(AppState.addEventListener);
  listen.mockClear();
  await setupUnlocked();
  const change = listen.mock.calls[0][1];
  act(() => change('background'));
  expect(screen.queryByTestId('calendar-view-month')).toBeNull();
  expect(screen.queryByLabelText('Profile')).toBeNull();
  expect(screen.getByText('Calendar locked')).toBeOnTheScreen();
  await act(async () => change('active'));
  expect(screen.getByText('Unlock your calendar')).toBeOnTheScreen();
  expect(screen.queryByTestId('calendar-view-month')).toBeNull();
  listen.mockClear();
});

test('switching accounts hides the previous calendar and returning restores only its events', async () => {
  const start = new Date();
  const alice = { id: 'alice-isolation', email: 'alice@example.com' };
  const bob = { id: 'bob-isolation', email: 'bob@example.com' };
  await appStorage.setItem(
    eventsStorageKey(alice.id),
    serializeEvents([
      { id: 'alice-event', title: 'Alice private appointment', start },
    ]),
  );
  const { emit } = setup(alice);
  fireEvent.press(
    await screen.findByRole('button', { name: 'Unlock with Biometrics' }),
  );
  await screen.findByText('Alice private appointment');
  await act(async () => emit(bob));
  expect(screen.queryByText('Alice private appointment')).toBeNull();
  fireEvent.press(
    await screen.findByRole('button', { name: 'Unlock with Biometrics' }),
  );
  await screen.findByTestId('calendar-view-month');
  expect(screen.queryByText('Alice private appointment')).toBeNull();
  await act(async () => emit(alice));
  fireEvent.press(
    await screen.findByRole('button', { name: 'Unlock with Biometrics' }),
  );
  await screen.findByText('Alice private appointment');
});
